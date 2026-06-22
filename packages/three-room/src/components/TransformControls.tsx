"use client";

import { useRef } from "react";
import { TransformControls as DreiTransformControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSceneStore, useSelectedEntity } from "../../store";

export function TransformControls() {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);

  const selectedEntity = useSelectedEntity();
  const moveEntity = useSceneStore((s) => s.moveEntity);
  const rotateEntity = useSceneStore((s) => s.rotateEntity);
  const scaleEntity = useSceneStore((s) => s.scaleEntity);
  const transformMode = useSceneStore((s) => s.transformMode);

  if (!selectedEntity) return null;

  const handleTransformChange = () => {
    if (!controlsRef.current || !selectedEntity) return;

    const object = controlsRef.current.object;
    if (!object) return;

    const position = object.position;
    const rotation = object.rotation;
    const scale = object.scale.x;

    moveEntity(selectedEntity.id, {
      x: position.x,
      y: position.y,
      z: position.z,
    });

    rotateEntity(selectedEntity.id, {
      x: rotation.x,
      y: rotation.y,
      z: rotation.z,
    });

    scaleEntity(selectedEntity.id, scale);
  };

  return (
    <DreiTransformControls
      ref={controlsRef}
      object={null} // Will be set dynamically
      mode={transformMode}
      onObjectChange={handleTransformChange}
      camera={camera}
      domElement={gl.domElement}
      enabled={!selectedEntity.locked}
    />
  );
}

export default TransformControls;
