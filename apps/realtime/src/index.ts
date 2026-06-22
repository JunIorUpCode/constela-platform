import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import jwt from "jsonwebtoken";
import { config } from "dotenv";
import { RoomManager } from "./services/roomManager";
import { SceneEvents, type SceneEventPayload } from "./types/events";

config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ==============================================
// Authentication Middleware
// ==============================================

interface AuthPayload {
  userId: string;
  sessionId: string;
  role: string;
  tenantId: string | null;
}

function authenticateSocket(socket: Socket, next: (err?: Error) => void) {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication required"));
  }

  try {
    const secret = process.env.AUTH_SECRET || "development-secret";
    const decoded = jwt.verify(token, secret) as AuthPayload;
    socket.data.user = decoded;
    next();
  } catch (error) {
    next(new Error("Invalid token"));
  }
}

// ==============================================
// Room Manager
// ==============================================

const roomManager = new RoomManager();

// ==============================================
// Socket.IO Connection
// ==============================================

io.use(authenticateSocket);

io.on("connection", (socket: Socket) => {
  const user = socket.data.user as AuthPayload;
  console.log(`🔌 User connected: ${user.userId}`);

  // ==============================================
  // Room Events
  // ==============================================

  socket.on(SceneEvents.ROOM_JOIN, async (payload: { sessionId: string }) => {
    try {
      const room = await roomManager.joinRoom(
        payload.sessionId,
        user.userId,
        user.role
      );

      socket.join(payload.sessionId);

      // Notify others
      socket.to(payload.sessionId).emit(SceneEvents.USER_JOINED, {
        userId: user.userId,
        users: room.getUsers(),
      });

      // Send current scene state to joining user
      socket.emit(SceneEvents.ROOM_STATE, room.getState());

      console.log(`📥 ${user.userId} joined room ${payload.sessionId}`);
    } catch (error) {
      socket.emit(SceneEvents.ERROR, { message: "Failed to join room" });
    }
  });

  socket.on(SceneEvents.ROOM_LEAVE, (payload: { sessionId: string }) => {
    roomManager.leaveRoom(payload.sessionId, user.userId);
    socket.leave(payload.sessionId);

    socket.to(payload.sessionId).emit(SceneEvents.USER_LEFT, {
      userId: user.userId,
    });

    console.log(`📤 ${user.userId} left room ${payload.sessionId}`);
  });

  // ==============================================
  // Entity Events
  // ==============================================

  socket.on(SceneEvents.AVATAR_ADD, (payload: SceneEventPayload) => {
    const room = roomManager.getRoom(payload.sessionId);
    if (!room) return;

    // Check permission
    if (!canModifyScene(user.role)) {
      socket.emit(SceneEvents.ERROR, { message: "Permission denied" });
      return;
    }

    room.addEntity(payload.entity);
    socket.to(payload.sessionId).emit(SceneEvents.AVATAR_ADDED, payload);
  });

  socket.on(SceneEvents.AVATAR_MOVE, (payload: SceneEventPayload) => {
    const room = roomManager.getRoom(payload.sessionId);
    if (!room) return;

    // Check if entity is locked
    const entity = room.getEntity(payload.entity.id);
    if (entity?.locked) {
      socket.emit(SceneEvents.ERROR, { message: "Entity is locked" });
      return;
    }

    // Check permission
    if (!canModifyScene(user.role) && entity?.controlledByUserId !== user.userId) {
      socket.emit(SceneEvents.ERROR, { message: "Permission denied" });
      return;
    }

    room.updateEntity(payload.entity.id, { position: payload.position });
    socket.to(payload.sessionId).emit(SceneEvents.AVATAR_MOVED, payload);
  });

  socket.on(SceneEvents.AVATAR_ROTATE, (payload: SceneEventPayload) => {
    const room = roomManager.getRoom(payload.sessionId);
    if (!room) return;

    const entity = room.getEntity(payload.entity.id);
    if (entity?.locked) {
      socket.emit(SceneEvents.ERROR, { message: "Entity is locked" });
      return;
    }

    if (!canModifyScene(user.role) && entity?.controlledByUserId !== user.userId) {
      socket.emit(SceneEvents.ERROR, { message: "Permission denied" });
      return;
    }

    room.updateEntity(payload.entity.id, { rotation: payload.rotation });
    socket.to(payload.sessionId).emit(SceneEvents.AVATAR_ROTATED, payload);
  });

  socket.on(SceneEvents.AVATAR_LOCK, (payload: { sessionId: string; entityId: string; locked: boolean }) => {
    const room = roomManager.getRoom(payload.sessionId);
    if (!room) return;

    if (!canModifyScene(user.role)) {
      socket.emit(SceneEvents.ERROR, { message: "Permission denied" });
      return;
    }

    room.updateEntity(payload.entityId, { locked: payload.locked });
    socket.to(payload.sessionId).emit(SceneEvents.AVATAR_LOCKED, payload);
  });

  socket.on(SceneEvents.OBJECT_ADD, (payload: SceneEventPayload) => {
    const room = roomManager.getRoom(payload.sessionId);
    if (!room) return;

    if (!canModifyScene(user.role)) {
      socket.emit(SceneEvents.ERROR, { message: "Permission denied" });
      return;
    }

    room.addEntity(payload.entity);
    socket.to(payload.sessionId).emit(SceneEvents.OBJECT_ADDED, payload);
  });

  socket.on(SceneEvents.OBJECT_MOVE, (payload: SceneEventPayload) => {
    const room = roomManager.getRoom(payload.sessionId);
    if (!room) return;

    const entity = room.getEntity(payload.entity.id);
    if (entity?.locked || !canModifyScene(user.role)) {
      socket.emit(SceneEvents.ERROR, { message: "Permission denied" });
      return;
    }

    room.updateEntity(payload.entity.id, { position: payload.position });
    socket.to(payload.sessionId).emit(SceneEvents.OBJECT_MOVED, payload);
  });

  socket.on(SceneEvents.OBJECT_DELETE, (payload: { sessionId: string; entityId: string }) => {
    const room = roomManager.getRoom(payload.sessionId);
    if (!room) return;

    if (!canModifyScene(user.role)) {
      socket.emit(SceneEvents.ERROR, { message: "Permission denied" });
      return;
    }

    room.removeEntity(payload.entityId);
    socket.to(payload.sessionId).emit(SceneEvents.OBJECT_DELETED, payload);
  });

  // ==============================================
  // Permission Events
  // ==============================================

  socket.on(SceneEvents.PERMISSION_UPDATE, (payload: {
    sessionId: string;
    entityId: string;
    controlledByUserId: string | null;
    visibleTo: "ALL" | "PRACTITIONER_ONLY";
  }) => {
    if (!canModifyScene(user.role)) {
      socket.emit(SceneEvents.ERROR, { message: "Permission denied" });
      return;
    }

    const room = roomManager.getRoom(payload.sessionId);
    if (!room) return;

    room.updateEntity(payload.entityId, {
      controlledByUserId: payload.controlledByUserId,
      visibleTo: payload.visibleTo,
    });

    socket.to(payload.sessionId).emit(SceneEvents.PERMISSION_UPDATED, payload);
  });

  // ==============================================
  // Snapshot Events
  // ==============================================

  socket.on(SceneEvents.SCENE_SAVE, (payload: { sessionId: string }) => {
    if (!canModifyScene(user.role)) {
      socket.emit(SceneEvents.ERROR, { message: "Permission denied" });
      return;
    }

    const room = roomManager.getRoom(payload.sessionId);
    if (!room) return;

    const state = room.saveSnapshot(user.userId);
    socket.emit(SceneEvents.SCENE_SAVED, { snapshotId: state.version });
  });

  socket.on(SceneEvents.SCENE_SNAPSHOT, (payload: { sessionId: string }) => {
    if (!canModifyScene(user.role)) {
      socket.emit(SceneEvents.ERROR, { message: "Permission denied" });
      return;
    }

    const room = roomManager.getRoom(payload.sessionId);
    if (!room) return;

    const snapshot = room.createSnapshot();
    io.to(payload.sessionId).emit(SceneEvents.SCENE_SNAPSHOT_CREATED, snapshot);
  });

  // ==============================================
  // Disconnect
  // ==============================================

  socket.on("disconnect", () => {
    console.log(`🔌 User disconnected: ${user.userId}`);
    // Leave all rooms
    roomManager.leaveAllRooms(user.userId);
  });
});

// ==============================================
// Permission Helper
// ==============================================

function canModifyScene(role: string): boolean {
  return ["PLATFORM_ADMIN", "PRACTITIONER", "TENANT_ADMIN"].includes(role);
}

// ==============================================
// Start Server
// ==============================================

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Realtime server running on port ${PORT}`);
});

export { io };
