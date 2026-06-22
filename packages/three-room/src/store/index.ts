import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  SceneEntity,
  CameraState,
  CameraMode,
  TransformMode,
  Selection,
  Vector3,
  EntityType,
} from "../types";
import {
  DEFAULT_CAMERA_POSITION,
  DEFAULT_CAMERA_TARGET,
} from "../types";

// ==============================================
// Scene Store State
// ==============================================

interface SceneStoreState {
  // Scene data
  sessionId: string | null;
  version: number;
  camera: CameraState;
  entities: SceneEntity[];
  isLoading: boolean;

  // Selection
  selectedEntityId: string | null;
  hoveredEntityId: string | null;

  // Transform mode
  transformMode: TransformMode;

  // History
  history: SceneState[];
  historyIndex: number;
}

// ==============================================
// Scene Store Actions
// ==============================================

interface SceneStoreActions {
  // Scene initialization
  initScene: (sessionId: string, state?: Partial<SceneState>) => void;
  setLoading: (loading: boolean) => void;

  // Entity operations
  addEntity: (entity: Omit<SceneEntity, "id">) => string;
  removeEntity: (id: string) => void;
  updateEntity: (id: string, updates: Partial<SceneEntity>) => void;

  // Selection
  selectEntity: (id: string | null) => void;
  setHoveredEntity: (id: string | null) => void;

  // Transform
  setTransformMode: (mode: TransformMode) => void;
  moveEntity: (id: string, position: Vector3) => void;
  rotateEntity: (id: string, rotation: Vector3) => void;
  scaleEntity: (id: string, scale: number) => void;
  lockEntity: (id: string, locked: boolean) => void;

  // Camera
  setCameraMode: (mode: CameraMode) => void;
  resetCamera: () => void;

  // History
  saveToHistory: () => void;
  undo: () => void;
  redo: () => void;

  // State management
  loadSceneState: (state: SceneState) => void;
  resetScene: () => void;
}

// ==============================================
// Helper Functions
// ==============================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ==============================================
// Store Definition
// ==============================================

export const useSceneStore = create<SceneStoreState & SceneStoreActions>()(
  immer((set, get) => ({
    // Initial state
    sessionId: null,
    version: 0,
    camera: {
      mode: "TOP",
      position: DEFAULT_CAMERA_POSITION,
      target: DEFAULT_CAMERA_TARGET,
    },
    entities: [],
    isLoading: false,
    selectedEntityId: null,
    hoveredEntityId: null,
    transformMode: "translate",
    history: [],
    historyIndex: -1,

    // Actions
    initScene: (sessionId, initialState) => {
      set((state) => {
        state.sessionId = sessionId;
        state.version = initialState?.version || 0;
        state.entities = initialState?.entities || [];
        if (initialState?.camera) {
          state.camera = initialState.camera;
        }
        state.history = [];
        state.historyIndex = -1;
      });
    },

    setLoading: (loading) => {
      set((state) => {
        state.isLoading = loading;
      });
    },

    addEntity: (entityData) => {
      const id = generateId();
      const entity: SceneEntity = {
        ...entityData,
        id,
      };

      set((state) => {
        state.entities.push(entity);
        state.version += 1;
      });

      get().saveToHistory();
      return id;
    },

    removeEntity: (id) => {
      set((state) => {
        state.entities = state.entities.filter((e) => e.id !== id);
        if (state.selectedEntityId === id) {
          state.selectedEntityId = null;
        }
        state.version += 1;
      });

      get().saveToHistory();
    },

    updateEntity: (id, updates) => {
      set((state) => {
        const entity = state.entities.find((e) => e.id === id);
        if (entity) {
          Object.assign(entity, updates);
          state.version += 1;
        }
      });

      get().saveToHistory();
    },

    selectEntity: (id) => {
      set((state) => {
        state.selectedEntityId = id;
      });
    },

    setHoveredEntity: (id) => {
      set((state) => {
        state.hoveredEntityId = id;
      });
    },

    setTransformMode: (mode) => {
      set((state) => {
        state.transformMode = mode;
      });
    },

    moveEntity: (id, position) => {
      set((state) => {
        const entity = state.entities.find((e) => e.id === id);
        if (entity && !entity.locked) {
          entity.position = position;
        }
      });
    },

    rotateEntity: (id, rotation) => {
      set((state) => {
        const entity = state.entities.find((e) => e.id === id);
        if (entity && !entity.locked) {
          entity.rotation = rotation;
        }
      });
    },

    scaleEntity: (id, scale) => {
      set((state) => {
        const entity = state.entities.find((e) => e.id === id);
        if (entity && !entity.locked) {
          entity.scale = scale;
        }
      });
    },

    lockEntity: (id, locked) => {
      set((state) => {
        const entity = state.entities.find((e) => e.id === id);
        if (entity) {
          entity.locked = locked;
        }
      });
    },

    setCameraMode: (mode) => {
      set((state) => {
        state.camera.mode = mode;
        // Reset camera position based on mode
        switch (mode) {
          case "TOP":
            state.camera.position = { x: 0, y: 15, z: 0 };
            state.camera.target = { x: 0, y: 0, z: 0 };
            break;
          case "FRONT":
            state.camera.position = { x: 0, y: 0, z: 15 };
            state.camera.target = { x: 0, y: 0, z: 0 };
            break;
          case "PERSPECTIVE":
            state.camera.position = { x: 10, y: 10, z: 10 };
            state.camera.target = { x: 0, y: 0, z: 0 };
            break;
        }
      });
    },

    resetCamera: () => {
      set((state) => {
        state.camera = {
          mode: "TOP",
          position: DEFAULT_CAMERA_POSITION,
          target: DEFAULT_CAMERA_TARGET,
        };
      });
    },

    saveToHistory: () => {
      set((state) => {
        const currentState: SceneState = {
          sessionId: state.sessionId || "",
          version: state.version,
          camera: state.camera,
          entities: JSON.parse(JSON.stringify(state.entities)),
        };

        // Remove any future history if we're not at the end
        if (state.historyIndex < state.history.length - 1) {
          state.history = state.history.slice(0, state.historyIndex + 1);
        }

        state.history.push(currentState);
        state.historyIndex = state.history.length - 1;

        // Limit history to 50 entries
        if (state.history.length > 50) {
          state.history.shift();
          state.historyIndex -= 1;
        }
      });
    },

    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex > 0) {
        const previousState = history[historyIndex - 1];
        set((state) => {
          state.entities = JSON.parse(JSON.stringify(previousState.entities));
          state.camera = previousState.camera;
          state.historyIndex -= 1;
        });
      }
    },

    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex < history.length - 1) {
        const nextState = history[historyIndex + 1];
        set((state) => {
          state.entities = JSON.parse(JSON.stringify(nextState.entities));
          state.camera = nextState.camera;
          state.historyIndex += 1;
        });
      }
    },

    loadSceneState: (sceneState) => {
      set((state) => {
        state.sessionId = sceneState.sessionId;
        state.version = sceneState.version;
        state.camera = sceneState.camera;
        state.entities = sceneState.entities;
      });
    },

    resetScene: () => {
      set((state) => {
        state.entities = [];
        state.selectedEntityId = null;
        state.history = [];
        state.historyIndex = -1;
      });
    },
  }))
);

// ==============================================
// Selector Hooks
// ==============================================

export const useSelectedEntity = () => {
  const entities = useSceneStore((s) => s.entities);
  const selectedId = useSceneStore((s) => s.selectedEntityId);
  return entities.find((e) => e.id === selectedId) || null;
};

export const useEntity = (id: string) => {
  return useSceneStore((s) => s.entities.find((e) => e.id === id));
};

export const useEntitiesByType = (type: EntityType) => {
  return useSceneStore((s) => s.entities.filter((e) => e.type === type));
};
