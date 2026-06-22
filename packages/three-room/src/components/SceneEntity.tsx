"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { SceneEntity as SceneEntityType } from "../../types";
import { useSceneStore } from "../../store";

interface SceneEntityProps {
  entity: SceneEntityType;
  canEdit?: boolean;
}

export function SceneEntity({ entity, canEdit = true }: SceneEntityProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);

  const selectEntity = useSceneStore((s) => s.selectEntity);
  const selectedEntityId = useSceneStore((s) => s.selectedEntityId);
  const setHoveredEntity = useSceneStore((s) => s.setHoveredEntity);

  const isSelected = selectedEntityId === entity.id;

  // Animate hover
  useFrame(() => {
    if (meshRef.current) {
      const targetY = isHovered ? 0.1 : 0;
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        targetY,
        0.1
      );
    }
  });

  const handleClick = (e: THREE.Event) => {
    e.stopPropagation();
    if (canEdit) {
      selectEntity(entity.id);
    }
  };

  const handlePointerOver = (e: THREE.Event) => {
    e.stopPropagation();
    setIsHovered(true);
    setHoveredEntity(entity.id);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = () => {
    setIsHovered(false);
    setHoveredEntity(null);
    document.body.style.cursor = "auto";
  };

  const position: [number, number, number] = [
    entity.position.x,
    entity.position.y,
    entity.position.z,
  ];

  const rotation: [number, number, number] = [
    entity.rotation.x,
    entity.rotation.y,
    entity.rotation.z,
  ];

  // Different visual based on entity type
  const renderEntity = () => {
    if (entity.type === "AVATAR") {
      return <AvatarMesh isSelected={isSelected} isHovered={isHovered} />;
    }

    if (entity.type === "OBJECT") {
      return <ObjectMesh isSelected={isSelected} isHovered={isHovered} />;
    }

    return <MarkerMesh isSelected={isSelected} isHovered={isHovered} />;
  };

  return (
    <group
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={entity.scale}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {renderEntity()}

      {/* Floating label */}
      {(isSelected || isHovered) && (
        <Html
          position={[0, 1.5, 0]}
          center
          style={{
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.75)",
              color: "white",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: isSelected ? "bold" : "normal",
              whiteSpace: "nowrap",
            }}
          >
            {entity.label}
            {entity.locked && " 🔒"}
          </div>
        </Html>
      )}

      {/* Selection indicator */}
      {isSelected && canEdit && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.6, 0.65, 32]} />
          <meshBasicMaterial color="#4ade80" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}

function AvatarMesh({ isSelected, isHovered }: { isSelected: boolean; isHovered: boolean }) {
  const color = isSelected ? "#4ade80" : isHovered ? "#60a5fa" : "#d4a574";

  return (
    <group>
      {/* Body */}
      <mesh castShadow position={[0, 0.6, 0]}>
        <capsuleGeometry args={[0.25, 0.5, 8, 16]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>

      {/* Head */}
      <mesh castShadow position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#f5deb3" roughness={0.8} />
      </mesh>

      {/* Shadow on ground */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.35, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

function ObjectMesh({ isSelected, isHovered }: { isSelected: boolean; isHovered: boolean }) {
  const color = isSelected ? "#4ade80" : isHovered ? "#60a5fa" : "#8b7355";

  return (
    <group>
      {/* Object base */}
      <mesh castShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[0.5, 0.6, 0.3]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Top decoration */}
      <mesh castShadow position={[0, 0.65, 0]}>
        <coneGeometry args={[0.2, 0.2, 4]} />
        <meshStandardMaterial color="#d4a574" roughness={0.5} />
      </mesh>

      {/* Shadow */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

function MarkerMesh({ isSelected, isHovered }: { isSelected: boolean; isHovered: boolean }) {
  const color = isSelected ? "#4ade80" : isHovered ? "#60a5fa" : "#d4a574";

  return (
    <group>
      {/* Marker pole */}
      <mesh castShadow>
        <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>

      {/* Marker top */}
      <mesh castShadow position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Shadow */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.15, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

export default SceneEntity;
