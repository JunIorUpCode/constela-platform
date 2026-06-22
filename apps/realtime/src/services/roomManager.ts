import type { SceneEntity, RoomUser, RoomState, Vector3 } from "../types";

interface RoomData {
  sessionId: string;
  entities: Map<string, SceneEntity>;
  users: Map<string, RoomUser>;
  version: number;
  createdAt: Date;
}

export class RoomManager {
  private rooms: Map<string, RoomData> = new Map();

  async joinRoom(sessionId: string, userId: string, role: string): Promise<RoomData> {
    let room = this.rooms.get(sessionId);

    if (!room) {
      room = {
        sessionId,
        entities: new Map(),
        users: new Map(),
        version: 0,
        createdAt: new Date(),
      };
      this.rooms.set(sessionId, room);
    }

    room.users.set(userId, {
      userId,
      role,
      joinedAt: new Date(),
    });

    return room;
  }

  leaveRoom(sessionId: string, userId: string): void {
    const room = this.rooms.get(sessionId);
    if (!room) return;

    room.users.delete(userId);

    // Remove entities controlled by this user
    for (const [entityId, entity] of room.entities) {
      if (entity.controlledByUserId === userId) {
        room.entities.delete(entityId);
      }
    }

    // Clean up empty rooms
    if (room.users.size === 0) {
      this.rooms.delete(sessionId);
    }
  }

  leaveAllRooms(userId: string): void {
    for (const [sessionId, room] of this.rooms) {
      if (room.users.has(userId)) {
        this.leaveRoom(sessionId, userId);
      }
    }
  }

  getRoom(sessionId: string): RoomData | undefined {
    return this.rooms.get(sessionId);
  }

  addEntity(sessionId: string, entity: SceneEntity): void {
    const room = this.rooms.get(sessionId);
    if (!room) return;

    room.entities.set(entity.id, entity);
    room.version += 1;
  }

  updateEntity(
    sessionId: string,
    entityId: string,
    updates: Partial<SceneEntity>
  ): void {
    const room = this.rooms.get(sessionId);
    if (!room) return;

    const entity = room.entities.get(entityId);
    if (!entity) return;

    const updated = { ...entity, ...updates };
    room.entities.set(entityId, updated);
    room.version += 1;
  }

  removeEntity(sessionId: string, entityId: string): void {
    const room = this.rooms.get(sessionId);
    if (!room) return;

    room.entities.delete(entityId);
    room.version += 1;
  }

  getEntity(sessionId: string, entityId: string): SceneEntity | undefined {
    return this.rooms.get(sessionId)?.entities.get(entityId);
  }

  getState(sessionId: string): RoomState | null {
    const room = this.rooms.get(sessionId);
    if (!room) return null;

    return {
      sessionId,
      entities: Array.from(room.entities.values()),
      users: Array.from(room.users.values()),
      version: room.version,
    };
  }

  saveSnapshot(sessionId: string, userId: string): RoomState {
    const room = this.rooms.get(sessionId);
    if (!room) {
      throw new Error("Room not found");
    }

    room.version += 1;

    return {
      sessionId,
      entities: Array.from(room.entities.values()),
      users: Array.from(room.users.values()),
      version: room.version,
    };
  }

  createSnapshot(sessionId: string): {
    sessionId: string;
    entities: SceneEntity[];
    timestamp: Date;
    version: number;
  } {
    const room = this.rooms.get(sessionId);
    if (!room) {
      throw new Error("Room not found");
    }

    return {
      sessionId,
      entities: Array.from(room.entities.values()),
      timestamp: new Date(),
      version: room.version,
    };
  }

  clearRoom(sessionId: string): void {
    this.rooms.delete(sessionId);
  }

  getRooms(): string[] {
    return Array.from(this.rooms.keys());
  }

  getRoomStats(sessionId: string): { users: number; entities: number } | null {
    const room = this.rooms.get(sessionId);
    if (!room) return null;

    return {
      users: room.users.size,
      entities: room.entities.size,
    };
  }
}

export const roomManager = new RoomManager();
