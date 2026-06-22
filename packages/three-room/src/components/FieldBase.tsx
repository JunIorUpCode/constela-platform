"use client";

import { useRef } from "react";
import * as THREE from "three";

export function FieldBase() {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <group>
      {/* Main field plane */}
      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial
          color="#2d4a3e"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Field border */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[9.5, 10, 64]} />
        <meshStandardMaterial color="#1a2f28" roughness={0.9} />
      </mesh>

      {/* Center marker */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 32]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>

      {/* Position markers (representative spots) */}
      {[
        { x: 0, z: -3, label: "A" },
        { x: -2, z: -1, label: "B" },
        { x: 2, z: -1, label: "C" },
        { x: -1, z: 2, label: "D" },
        { x: 1, z: 2, label: "E" },
      ].map((spot, i) => (
        <group key={i} position={[spot.x, 0.01, spot.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.15, 16]} />
            <meshStandardMaterial
              color="#8b7355"
              roughness={0.6}
              transparent
              opacity={0.6}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default FieldBase;
