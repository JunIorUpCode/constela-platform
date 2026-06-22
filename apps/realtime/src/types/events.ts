export enum SceneEvents {
  // Connection
  ROOM_JOIN = "room:join",
  ROOM_LEAVE = "room:leave",
  ROOM_STATE = "room:state",
  USER_JOINED = "user:joined",
  USER_LEFT = "user:left",

  // Avatar
  AVATAR_ADD = "avatar:add",
  AVATAR_ADDED = "avatar:added",
  AVATAR_MOVE = "avatar:move",
  AVATAR_MOVED = "avatar:moved",
  AVATAR_ROTATE = "avatar:rotate",
  AVATAR_ROTATED = "avatar:rotated",
  AVATAR_LOCK = "avatar:lock",
  AVATAR_LOCKED = "avatar:locked",
  AVATAR_REMOVE = "avatar:remove",
  AVATAR_REMOVED = "avatar:removed",

  // Objects
  OBJECT_ADD = "object:add",
  OBJECT_ADDED = "object:added",
  OBJECT_MOVE = "object:move",
  OBJECT_MOVED = "object:moved",
  OBJECT_DELETE = "object:delete",
  OBJECT_DELETED = "object:deleted",

  // Permissions
  PERMISSION_UPDATE = "permission:update",
  PERMISSION_UPDATED = "permission:updated",

  // Scene
  SCENE_SAVE = "scene:save",
  SCENE_SAVED = "scene:saved",
  SCENE_SNAPSHOT = "scene:snapshot",
  SCENE_SNAPSHOT_CREATED = "scene:snapshot_created",

  // Errors
  ERROR = "error",
}

// ==============================================
// Entity Types
// ==============================================

export type EntityType = "AVATAR" | "OBJECT" | "FIELD_MARKER";

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface SceneEntity {
  id: string;
  type: EntityType;
  label: string;
  assetUrl: string;
  position: Vector3;
  rotation: Vector3;
  scale: number;
  locked: boolean;
  visibleTo: "ALL" | "PRACTITIONER_ONLY";
  controlledByUserId: string | null;
  metadata: Record<string, unknown> | null;
}

// ==============================================
// Event Payloads
// ==============================================

export interface SceneEventPayload {
  sessionId: string;
  entity: SceneEntity;
  position?: Vector3;
  rotation?: Vector3;
  version?: number;
  clientTimestamp?: number;
}

export interface RoomState {
  sessionId: string;
  entities: SceneEntity[];
  users: RoomUser[];
  version: number;
}

export interface RoomUser {
  userId: string;
  role: string;
  joinedAt: Date;
}
