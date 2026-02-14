const jwt = require("jsonwebtoken");

const roomUsers = new Map();
const voiceUsers = new Map();
const socketProfiles = new Map();

function trackJoin(roomId, socketId) {
  if (!roomUsers.has(roomId)) {
    roomUsers.set(roomId, new Set());
  }
  roomUsers.get(roomId).add(socketId);
}

function trackLeave(socket, rooms) {
  rooms.forEach((roomId) => {
    if (roomId === socket.id) {
      return;
    }

    const users = roomUsers.get(roomId);
    if (!users) {
      return;
    }

    users.delete(socket.id);
    if (users.size === 0) {
      roomUsers.delete(roomId);
    }
  });
}

function getVoiceSet(roomId) {
  if (!voiceUsers.has(roomId)) {
    voiceUsers.set(roomId, new Set());
  }
  return voiceUsers.get(roomId);
}

function getDisplayName(socketId) {
  return socketProfiles.get(socketId)?.name || "Guest";
}

function removeFromVoiceRooms(socket, rooms, io) {
  rooms.forEach((roomId) => {
    if (roomId === socket.id) {
      return;
    }

    const members = voiceUsers.get(roomId);
    if (!members || !members.has(socket.id)) {
      return;
    }

    members.delete(socket.id);
    socket.to(roomId).emit("voice-user-left", { socketId: socket.id, userId: socket.userId });

    if (members.size === 0) {
      voiceUsers.delete(roomId);
    }
  });
}

function socketAuthMiddleware(socket, next) {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Unauthorized: token missing"));
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.userId;
    socket.email = payload.email;
    return next();
  } catch (error) {
    return next(new Error("Unauthorized: invalid token"));
  }
}

function initSocket(io) {
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    socket.on("join-room", (payload) => {
      const roomId = typeof payload === "string" ? payload : payload?.roomId;
      const userName = typeof payload === "string" ? null : payload?.userName;

      if (!roomId || typeof roomId !== "string") {
        return;
      }

      socketProfiles.set(socket.id, {
        name: userName || socketProfiles.get(socket.id)?.name || "Guest",
      });

      socket.join(roomId);
      trackJoin(roomId, socket.id);
      io.to(roomId).emit("room-users", { roomId, count: roomUsers.get(roomId)?.size || 0 });
    });

    socket.on("chat-message", ({ roomId, message }) => {
      if (!roomId || typeof message !== "string") {
        return;
      }

      const text = message.trim();
      if (!text) {
        return;
      }

      io.to(roomId).emit("chat-message", {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        roomId,
        message: text,
        userId: socket.userId,
        userName: getDisplayName(socket.id),
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("voice-join", ({ roomId, muted }) => {
      if (!roomId) {
        return;
      }

      const members = getVoiceSet(roomId);
      const existing = [...members]
        .filter((memberId) => memberId !== socket.id)
        .map((memberId) => ({
          socketId: memberId,
          userName: getDisplayName(memberId),
        }));

      members.add(socket.id);
      socket.emit("voice-users", { roomId, users: existing });
      socket.to(roomId).emit("voice-user-joined", {
        roomId,
        socketId: socket.id,
        userId: socket.userId,
        userName: getDisplayName(socket.id),
        muted: !!muted,
      });
    });

    socket.on("voice-leave", ({ roomId }) => {
      if (!roomId) {
        return;
      }
      const members = voiceUsers.get(roomId);
      if (!members) {
        return;
      }
      members.delete(socket.id);
      socket.to(roomId).emit("voice-user-left", { socketId: socket.id, userId: socket.userId });
      if (members.size === 0) {
        voiceUsers.delete(roomId);
      }
    });

    socket.on("voice-mute", ({ roomId, muted }) => {
      if (!roomId) {
        return;
      }
      socket.to(roomId).emit("voice-user-muted", { socketId: socket.id, muted: !!muted });
    });

    socket.on("voice-signal", ({ roomId, targetSocketId, signal }) => {
      if (!roomId || !targetSocketId || !signal) {
        return;
      }
      io.to(targetSocketId).emit("voice-signal", {
        roomId,
        fromSocketId: socket.id,
        fromUserId: socket.userId,
        fromUserName: getDisplayName(socket.id),
        signal,
      });
    });

    socket.on("element-create", ({ roomId, element }) => {
      if (!roomId || !element) {
        return;
      }
      socket.to(roomId).emit("element-create", element);
    });

    socket.on("element-update", ({ roomId, element }) => {
      if (!roomId || !element) {
        return;
      }
      socket.to(roomId).emit("element-update", element);
    });

    socket.on("element-delete", ({ roomId, elementId }) => {
      if (!roomId || !elementId) {
        return;
      }
      socket.to(roomId).emit("element-delete", { elementId });
    });

    socket.on("element-clear", ({ roomId }) => {
      if (!roomId) {
        return;
      }
      socket.to(roomId).emit("element-clear");
    });

    socket.on("cursor-move", ({ roomId, cursor }) => {
      if (!roomId || !cursor) {
        return;
      }
      socket.to(roomId).emit("cursor-move", {
        userId: socket.userId,
        cursor,
      });
    });

    socket.on("disconnecting", () => {
      const rooms = [...socket.rooms];
      trackLeave(socket, rooms);
      removeFromVoiceRooms(socket, rooms, io);
      rooms.forEach((roomId) => {
        if (roomId !== socket.id) {
          io.to(roomId).emit("room-users", { roomId, count: roomUsers.get(roomId)?.size || 0 });
        }
      });
    });

    socket.on("disconnect", () => {
      socketProfiles.delete(socket.id);
    });
  });
}

module.exports = { initSocket };
