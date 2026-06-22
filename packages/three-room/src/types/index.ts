// ==============================================
// Scene Entity Types
// ==============================================

export type EntityType = "AVATAR" | "OBJECT" | "FIELD_MARKER";

export type CameraMode = "TOP" | "PERSPECTIVE" | "FRONT" | "FREE";

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
  entities: SceneEntity[];
}

// ==============================================
// Selection Types
// ==============================================

export interface Selection {
  entityId: string;
  entity: SceneEntity;
}

// ==============================================
// Transform Types
// ==============================================

export type TransformMode = "translate" | "rotate" | "scale";

export interface TransformConstraints {
  position?: boolean;
  rotation?: boolean;
  scale?: boolean;
  x?: boolean;
  y?: boolean;
  z?: boolean;
}

// ==============================================
// Default Values
// ==============================================

export const DEFAULT_CAMERA_POSITION: Vector3 = { x: 0, y: 10, z: 10 };
export const DEFAULT_CAMERA_TARGET: Vector3 = { x: 0, y: 0, z: 0 };
export const DEFAULT_ENTITY_SCALE = 1;
export const GRID_SIZE = 20;
export const GRID_DIVISIONS = 20;
