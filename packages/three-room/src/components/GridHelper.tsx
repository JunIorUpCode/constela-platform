"use client";

import { useRef } from "react";
import * as THREE from "three";

interface GridHelperProps {
  size?: number;
  divisions?: number;
}

export function GridHelper({ size = 20, divisions = 20 }: GridHelperProps) {
  return (
    <group>
      {/* Main grid */}
      <gridHelper
        args={[size, divisions, "#3d5a4e", "#243d33"]}
        position={[0, 0.01, 0]}
      />

      {/* Subtle center cross */}
      <group position={[0, 0.02, 0]}>
        <mesh>
          <boxGeometry args={[0.02, 0.001, size]} />
          <meshBasicMaterial color="#4a6a5e" transparent opacity={0.5} />
        </mesh>
        <mesh>
          <boxGeometry args={[size, 0.001, 0.02]} />
          <meshBasicMaterial color="#4a6a5e" transparent opacity={0.5} />
        </mesh>
      </group>
    </group>
  );
}

export default GridHelper;
