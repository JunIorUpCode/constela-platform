"use client";

import { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useSceneStore } from "../../store";
import type { CameraMode } from "../../types";

interface CameraControllerProps {}

export function CameraController({}: CameraControllerProps) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  const cameraMode = useSceneStore((s) => s.camera.mode);

  useEffect(() => {
    if (!controlsRef.current) return;

    const controls = controlsRef.current;

    switch (cameraMode) {
      case "TOP":
        camera.position.set(0, 15, 0);
        controls.target.set(0, 0, 0);
        controls.minPolarAngle = 0;
        controls.maxPolarAngle = Math.PI / 2;
        break;

      case "FRONT":
        camera.position.set(0, 0, 15);
        controls.target.set(0, 0, 0);
        controls.minPolarAngle = Math.PI / 2;
        controls.maxPolarAngle = Math.PI / 2;
        break;

      case "PERSPECTIVE":
        camera.position.set(10, 10, 10);
        controls.target.set(0, 0, 0);
        controls.minPolarAngle = 0.1;
        controls.maxPolarAngle = Math.PI / 2 - 0.1;
        break;

      case "FREE":
        controls.minPolarAngle = 0.1;
        controls.maxPolarAngle = Math.PI / 2 - 0.1;
        break;
    }

    controls.update();
  }, [cameraMode, camera]);

  // Smooth camera transitions
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera]}
      enableDamping
      dampingFactor={0.05}
      minDistance={5}
      maxDistance={30}
      maxPolarAngle={Math.PI / 2 - 0.1}
      enablePan
      panSpeed={0.5}
    />
  );
}

export default CameraController;
