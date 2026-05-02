"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Edges, TransformControls, useGLTF } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { useEditorStore } from "@/store/editor-store";
import type { SceneObject, Vector3Tuple } from "@/lib/scene";

function tupleFromVector(vector: THREE.Vector3): Vector3Tuple {
  return [vector.x, vector.y, vector.z];
}

function tupleFromEuler(euler: THREE.Euler): Vector3Tuple {
  return [euler.x, euler.y, euler.z];
}

function ModelContent({ object }: { object: SceneObject }) {
  const gltf = useGLTF(object.modelUrl ?? "");
  const clonedScene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) {
        return;
      }

      const material = new THREE.MeshStandardMaterial({
        color: object.material.color,
        metalness: object.material.metalness,
        roughness: object.material.roughness,
        transparent: object.material.opacity < 1,
        opacity: object.material.opacity,
        wireframe: object.material.wireframe,
      });

      child.castShadow = true;
      child.receiveShadow = true;
      child.material = material;
    });
  }, [clonedScene, object.material]);

  return <primitive object={clonedScene} />;
}

function PrimitiveContent({ object, selected }: { object: SceneObject; selected: boolean }) {
  const material = (
    <meshStandardMaterial
      color={object.material.color}
      metalness={object.material.metalness}
      roughness={object.material.roughness}
      transparent={object.material.opacity < 1}
      opacity={object.material.opacity}
      wireframe={object.material.wireframe}
      emissive={selected ? "#0a332b" : "#000000"}
      emissiveIntensity={selected ? 0.9 : 0}
    />
  );

  if (object.type === "sphere") {
    return (
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.62, 48, 48]} />
        {material}
        {selected ? <Edges color="#8fffe1" threshold={15} /> : null}
      </mesh>
    );
  }

  if (object.type === "plane") {
    return (
      <mesh receiveShadow>
        <planeGeometry args={[1.6, 1.6, 24, 24]} />
        {material}
        {selected ? <Edges color="#8fffe1" threshold={15} /> : null}
      </mesh>
    );
  }

  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      {material}
      {selected ? <Edges color="#8fffe1" threshold={15} /> : null}
    </mesh>
  );
}

function ModelFallback({ object, selected }: { object: SceneObject; selected: boolean }) {
  return (
    <PrimitiveContent
      object={{
        ...object,
        type: "box",
        material: {
          ...object.material,
          opacity: 0.42,
          wireframe: true,
        },
      }}
      selected={selected}
    />
  );
}

export function SceneObjectMesh({ object }: { object: SceneObject }) {
  const groupRef = useRef<THREE.Group | null>(null);
  const transformStartedRef = useRef(false);
  const selectedObjectId = useEditorStore((state) => state.selectedObjectId);
  const transformMode = useEditorStore((state) => state.transformMode);
  const selectObject = useEditorStore((state) => state.selectObject);
  const updateObject = useEditorStore((state) => state.updateObject);
  const selected = selectedObjectId === object.id;

  function syncTransform(recordHistory = false) {
    const group = groupRef.current;

    if (!group || object.locked) {
      return;
    }

    updateObject(
      object.id,
      {
        position: tupleFromVector(group.position),
        rotation: tupleFromEuler(group.rotation),
        scale: tupleFromVector(group.scale),
      },
      recordHistory,
    );
  }

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    selectObject(object.id);
  }

  const content = (
    <group
      ref={groupRef}
      name={object.name}
      position={object.position}
      rotation={object.rotation}
      scale={object.scale}
      onPointerDown={handlePointerDown}
    >
      {object.type === "model" && object.modelUrl ? (
        <Suspense fallback={<ModelFallback object={object} selected={selected} />}>
          <ModelContent object={object} />
        </Suspense>
      ) : (
        <PrimitiveContent object={object} selected={selected} />
      )}
    </group>
  );

  if (selected && !object.locked) {
    return (
      <TransformControls
        mode={transformMode}
        onMouseDown={() => {
          if (transformStartedRef.current) {
            return;
          }

          transformStartedRef.current = true;
          updateObject(object.id, {}, true);
        }}
        onObjectChange={() => syncTransform(false)}
        onMouseUp={() => {
          syncTransform(false);
          transformStartedRef.current = false;
        }}
        size={0.82}
      >
        {content}
      </TransformControls>
    );
  }

  return content;
}
