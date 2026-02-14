require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const boardRoutes = require("./routes/boardRoutes");
const { initSocket } = require("./socket/socketHandler");

const app = express();
const server = http.createServer(app);

const DEFAULT_ALLOWED_ORIGINS = ["http://localhost:5173", "https://drawza.vercel.app"];
const ENV_ORIGINS = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const ALLOWED_ORIGINS = [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...ENV_ORIGINS])];

const corsOriginValidator = (origin, callback) => {
  // Allow non-browser tools (no Origin header), then strictly allow listed origins.
  if (!origin || ALLOWED_ORIGINS.includes(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error(`CORS blocked for origin: ${origin}`));
};

const io = new Server(server, {
  cors: {
    origin: corsOriginValidator,
    credentials: true,
  },
});

app.use(
  cors({
    origin: corsOriginValidator,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);

app.use((error, _req, res, _next) => {
  res.status(500).json({ message: "Unexpected server error", error: error.message });
});

initSocket(io);

const PORT = Number(process.env.PORT) || 5000;

async function start() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not set");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not set");
    }

    const mongoConnection = await mongoose.connect(process.env.MONGO_URI);
    // eslint-disable-next-line no-console
    console.log(`MongoDB connected: ${mongoConnection.connection.host}`);
    server.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server", error.message);
    process.exit(1);
  }
}

start();
