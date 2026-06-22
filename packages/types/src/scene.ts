// ==============================================
// Scene (3D Room) Types
// ==============================================

export enum EntityType {
  AVATAR = "AVATAR",
  OBJECT = "OBJECT",
  FIELD_MARKER = "FIELD_MARKER",
}

export enum CameraMode {
  TOP = "TOP",
  PERSPECTIVE = "PERSPECTIVE",
  FRONT = "FRONT",
  FREE = "FREE",
}

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

export interface CameraState {
  mode: CameraMode;
  position: Vector3;
  target: Vector3;
}

export interface SceneState {
  sessionId: string;
  version: number;
  camera: CameraState;
  objects: SceneEntity[];
}

// ==============================================
// Scene Events
// ==============================================

export enum SceneEventType {
  ROOM_JOIN = "room:join",
  ROOM_LEAVE = "room:leave",
  AVATAR_ADD = "avatar:add",
  AVATAR_MOVE = "avatar:move",
  AVATAR_ROTATE = "avatar:rotate",
  AVATAR_LOCK = "avatar:lock",
  AVATAR_UNLOCK = "avatar:unlock",
  AVATAR_REMOVE = "avatar:remove",
  OBJECT_ADD = "object:add",
  OBJECT_MOVE = "object:move",
  OBJECT_ROTATE = "object:rotate",
  OBJECT_DELETE = "object:delete",
  SCENE_SAVE = "scene:save",
  SCENE_SNAPSHOT = "scene:snapshot",
  PERMISSION_UPDATE = "permission:update",
}

export interface SceneEvent {
  id: string;
  sessionId: string;
  eventType: SceneEventType;
  payload: Record<string, unknown>;
  version: number;
  createdBy: string;
  createdAt: Date;
}

export interface SceneSnapshot {
  id: string;
  sessionId: string;
  imageUrl: string;
  sceneState: SceneState;
  createdBy: string;
  createdAt: Date;
}
