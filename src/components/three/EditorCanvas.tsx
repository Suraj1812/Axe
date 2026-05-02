"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  GizmoHelper,
  GizmoViewport,
  Grid,
  Html,
  OrbitControls,
} from "@react-three/drei";
import gsap from "gsap";
import { SceneObjectMesh } from "@/components/three/SceneObjectMesh";
import { useEditorStore } from "@/store/editor-store";
import type { UiBlock } from "@/lib/scene";

function UiBlockView({
  block,
  selected,
  onSelect,
  compact = false,
}: {
  block: UiBlock;
  selected: boolean;
  onSelect: () => void;
  compact?: boolean;
}) {
  const isButton = block.type === "button";

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      className={`pointer-events-auto flex items-center justify-center text-center ${
        isButton ? "font-semibold shadow-lg shadow-black/30" : "font-semibold"
      } ${selected ? "outline outline-2 outline-amber-300" : "outline-none"}`}
      style={{
        width: compact ? Math.max(block.size.width * 0.7, 92) : block.size.width,
        height: compact ? Math.max(block.size.height * 0.7, 30) : block.size.height,
        color: block.style.color,
        background: block.style.background,
        borderRadius: block.style.radius,
        fontSize: compact ? Math.max(block.style.fontSize * 0.75, 12) : block.style.fontSize,
      }}
    >
      <span className="max-w-full truncate px-2">{block.label}</span>
    </button>
  );
}

function AnchoredUiBlocks() {
  const objects = useEditorStore((state) => state.objects);
  const uiBlocks = useEditorStore((state) => state.uiBlocks);
  const selectedUiBlockId = useEditorStore((state) => state.selectedUiBlockId);
  const selectUiBlock = useEditorStore((state) => state.selectUiBlock);

  return (
    <>
      {uiBlocks
        .filter((block) => block.anchorObjectId)
        .map((block) => {
          const object = objects.find((item) => item.id === block.anchorObjectId);

          if (!object || !object.visible) {
            return null;
          }

          return (
            <Html
              key={block.id}
              position={[
                object.position[0],
                object.position[1] + 1.15 * object.scale[1],
                object.position[2],
              ]}
              center
              distanceFactor={7}
              occlude={false}
            >
              <UiBlockView
                block={block}
                compact
                selected={selectedUiBlockId === block.id}
                onSelect={() => selectUiBlock(block.id)}
              />
            </Html>
          );
        })}
    </>
  );
}

function ScreenUiBlocks() {
  const uiBlocks = useEditorStore((state) => state.uiBlocks);
  const selectedUiBlockId = useEditorStore((state) => state.selectedUiBlockId);
  const selectUiBlock = useEditorStore((state) => state.selectUiBlock);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {uiBlocks
        .filter((block) => !block.anchorObjectId)
        .map((block) => (
          <div
            key={block.id}
            className="absolute"
            style={{
              left: `${block.position.x}%`,
              top: `${block.position.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <UiBlockView
              block={block}
              selected={selectedUiBlockId === block.id}
              onSelect={() => selectUiBlock(block.id)}
            />
          </div>
        ))}
    </div>
  );
}

function CanvasHud() {
  const selectedObjectId = useEditorStore((state) => state.selectedObjectId);
  const selectedObject = useEditorStore((state) =>
    state.objects.find((object) => object.id === selectedObjectId),
  );
  const currentTime = useEditorStore((state) => state.currentTime);
  const transformMode = useEditorStore((state) => state.transformMode);

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-lg border border-zinc-800/90 bg-[#0d0f13]/90 px-3 py-2 text-xs text-zinc-400 shadow-xl shadow-black/30 backdrop-blur">
      <span className="font-mono text-emerald-300">{currentTime.toFixed(2)}s</span>
      <span className="h-3 w-px bg-zinc-800" />
      <span className="capitalize">{transformMode}</span>
      <span className="h-3 w-px bg-zinc-800" />
      <span className="max-w-48 truncate text-zinc-300">
        {selectedObject?.name ?? "No selection"}
      </span>
    </div>
  );
}

export function EditorCanvas() {
  const objects = useEditorStore((state) => state.objects);
  const selectObject = useEditorStore((state) => state.selectObject);
  const selectUiBlock = useEditorStore((state) => state.selectUiBlock);
  const currentTime = useEditorStore((state) => state.currentTime);
  const duration = useEditorStore((state) => state.duration);
  const scrollAnimationEnabled = useEditorStore(
    (state) => state.scrollAnimationEnabled,
  );
  const setCurrentTime = useEditorStore((state) => state.setCurrentTime);
  const scrollDriver = useRef({ value: currentTime });

  const visibleObjects = useMemo(
    () => objects.filter((object) => object.visible),
    [objects],
  );

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (!scrollAnimationEnabled) {
      return;
    }

    event.preventDefault();
    const nextTime = Math.min(
      Math.max(useEditorStore.getState().currentTime + event.deltaY * 0.003, 0),
      duration,
    );

    scrollDriver.current.value = useEditorStore.getState().currentTime;
    gsap.to(scrollDriver.current, {
      value: nextTime,
      duration: 0.35,
      ease: "power2.out",
      overwrite: true,
      onUpdate: () => setCurrentTime(scrollDriver.current.value),
    });
  }

  return (
    <div
      className="relative h-full w-full axe-checkerboard"
      onWheel={handleWheel}
      onPointerDown={() => selectUiBlock(null)}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [4, 3, 5], fov: 46, near: 0.1, far: 200 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        onPointerMissed={() => selectObject(null)}
      >
        <color attach="background" args={["#090a0d"]} />
        <fog attach="fog" args={["#090a0d", 12, 24]} />
        <ambientLight intensity={0.56} />
        <directionalLight
          castShadow
          position={[4, 7, 3]}
          intensity={1.35}
          shadow-mapSize={[1024, 1024]}
        />
        <Suspense
          fallback={
            <Html center>
              <div className="rounded-lg border border-zinc-800 bg-[#0d0f13] px-3 py-2 text-xs text-zinc-400">
                Loading asset
              </div>
            </Html>
          }
        >
          {visibleObjects.map((object) => (
            <SceneObjectMesh key={object.id} object={object} />
          ))}
          <AnchoredUiBlocks />
          <Environment preset="city" />
        </Suspense>
        <Grid
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#2a2f38"
          sectionSize={2}
          sectionThickness={1.1}
          sectionColor="#454d5a"
          fadeDistance={22}
          fadeStrength={1}
          infiniteGrid
        />
        <ContactShadows
          position={[0, -0.03, 0]}
          opacity={0.35}
          scale={10}
          blur={2.5}
          far={4}
        />
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
        <GizmoHelper alignment="bottom-right" margin={[76, 76]}>
          <GizmoViewport axisColors={["#f77f9a", "#24d6a3", "#8ea0ff"]} />
        </GizmoHelper>
      </Canvas>
      <ScreenUiBlocks />
      <CanvasHud />
    </div>
  );
}
