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
const isProduction = process.env.NODE_ENV === "production";

const DEFAULT_ALLOWED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173", "https://drawza.vercel.app"];
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

function getDatabaseStatus() {
  switch (mongoose.connection.readyState) {
    case 0:
      return "disconnected";
    case 1:
      return "connected";
    case 2:
      return "connecting";
    case 3:
      return "disconnecting";
    default:
      return "unknown";
  }
}

app.get("/api/health", (_, res) => {
  const database = getDatabaseStatus();
  const isHealthy = database === "connected";

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "ok" : "degraded",
    database,
  });
});

app.use("/api", (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  return res.status(503).json({
    message: "Database connection is not ready. Please try again shortly.",
    database: getDatabaseStatus(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);

app.use((error, _req, res, _next) => {
  res.status(500).json({ message: "Unexpected server error", error: error.message });
});

initSocket(io);

const PORT = Number(process.env.PORT) || 5000;

function listen(port) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      reject(error);
    };

    server.once("error", onError);
    server.listen(port, () => {
      server.off("error", onError);
      resolve();
    });
  });
}

async function start() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set");
  }

  const mongoConnection = await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 20000,
    bufferTimeoutMS: 5000,
  });
  // eslint-disable-next-line no-console
  console.log(`MongoDB connected: ${mongoConnection.connection.host}`);

  await listen(PORT);
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`);
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the existing server or set a different PORT in server/.env.`);
  } else {
    console.error("Failed to start server", error.message);
  }

  process.exit(1);
});
