const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { verifyJWT } = require("../middleware/authMiddleware");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function signToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function serializeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl || "",
    createdAt: user.createdAt,
  };
}

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Signup failed", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.password) {
      return res.status(401).json({ message: "This account uses Google sign-in. Please continue with Google." });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);

    return res.status(200).json({
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
});

router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: "GOOGLE_CLIENT_ID is not configured" });
    }

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({ message: "Google account email is not verified" });
    }

    const normalizedEmail = payload.email.toLowerCase().trim();
    const googleId = String(payload.sub || "").trim();
    const displayName = String(payload.name || normalizedEmail.split("@")[0] || "Google User").trim();
    const avatarUrl = String(payload.picture || "").trim();

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      user = await User.create({
        name: displayName,
        email: normalizedEmail,
        googleId,
        avatarUrl,
      });
    } else {
      let needsSave = false;

      if (googleId && user.googleId !== googleId) {
        user.googleId = googleId;
        needsSave = true;
      }

      if (avatarUrl && user.avatarUrl !== avatarUrl) {
        user.avatarUrl = avatarUrl;
        needsSave = true;
      }

      if (!user.name && displayName) {
        user.name = displayName;
        needsSave = true;
      }

      if (needsSave) {
        await user.save();
      }
    }

    const token = signToken(user);
    return res.status(200).json({
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    return res.status(401).json({ message: "Google sign-in failed", error: error.message });
  }
});

router.get("/me", verifyJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user: serializeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch profile", error: error.message });
  }
});

router.put("/me", verifyJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updates = {};
    if (typeof req.body.name === "string") {
      const name = req.body.name.trim();
      if (!name || name.length < 2 || name.length > 100) {
        return res.status(400).json({ message: "Name must be between 2 and 100 characters" });
      }
      updates.name = name;
    }

    if (typeof req.body.avatarUrl === "string") {
      updates.avatarUrl = req.body.avatarUrl.trim();
    }

    Object.assign(user, updates);
    await user.save();

    return res.status(200).json({ message: "Profile updated", user: serializeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
});

module.exports = router;
