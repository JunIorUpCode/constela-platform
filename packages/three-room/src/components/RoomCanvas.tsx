"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { useSceneStore } from "../../store";
import { FieldBase } from "./FieldBase";
import { SceneEntity } from "./SceneEntity";
import { CameraController } from "./CameraController";
import { GridHelper } from "./GridHelper";
import { TransformControls } from "./TransformControls";

interface RoomCanvasProps {
  sessionId: string;
  canEdit?: boolean;
  className?: string;
}

export function RoomCanvas({
  sessionId,
  canEdit = true,
  className = "",
}: RoomCanvasProps) {
  const entities = useSceneStore((s) => s.entities);
  const isLoading = useSceneStore((s) => s.isLoading);

  return (
    <div className={`three-canvas-container ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="text-lg">Carregando sala...</div>
        </div>
      )}

      <Canvas
        shadows
        camera={{ position: [0, 15, 0], fov: 50 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 20, 10]}
            intensity={1}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={50}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
          />

          {/* Field */}
          <FieldBase />

          {/* Grid */}
          <GridHelper size={20} divisions={20} />

          {/* Entities */}
          {entities.map((entity) => (
            <SceneEntity
              key={entity.id}
              entity={entity}
              canEdit={canEdit && !entity.locked}
            />
          ))}

          {/* Transform Controls */}
          {canEdit && <TransformControls />}

          {/* Camera Controller */}
          <CameraController />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default RoomCanvas;
