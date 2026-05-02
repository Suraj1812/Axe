"use client";

import { Trash2 } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import type {
  KeyframeChannel,
  MaterialConfig,
  SceneObject,
  UiBlock,
  Vector3Tuple,
} from "@/lib/scene";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[11px] font-medium uppercase text-zinc-500">
      {children}
    </label>
  );
}

function NumberInput({
  value,
  onChange,
  step = 0.1,
  min,
  max,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  label: string;
}) {
  return (
    <label className="min-w-0">
      <span className="mb-1 block font-mono text-[10px] uppercase text-zinc-600">
        {label}
      </span>
      <input
        type="number"
        value={Number(value.toFixed(3))}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-9 w-full rounded-lg border border-zinc-800 bg-[#11141a] px-2 font-mono text-xs text-zinc-200 outline-none focus:border-emerald-300/70"
      />
    </label>
  );
}

function VectorEditor({
  label,
  value,
  onChange,
  rotation = false,
  min,
}: {
  label: string;
  value: Vector3Tuple;
  onChange: (value: Vector3Tuple) => void;
  rotation?: boolean;
  min?: number;
}) {
  const displayValue: Vector3Tuple = rotation
    ? value.map((item) => (item * 180) / Math.PI) as Vector3Tuple
    : value;

  function updateAt(index: number, nextValue: number) {
    const next = [...displayValue] as Vector3Tuple;
    next[index] = nextValue;
    onChange(
      rotation
        ? next.map((item) => (item * Math.PI) / 180) as Vector3Tuple
        : next,
    );
  }

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="grid grid-cols-3 gap-2">
        {(["x", "y", "z"] as const).map((axis, index) => (
          <NumberInput
            key={axis}
            label={axis}
            value={displayValue[index]}
            step={rotation ? 1 : 0.1}
            min={min}
            onChange={(nextValue) => updateAt(index, nextValue)}
          />
        ))}
      </div>
    </div>
  );
}

function MaterialEditor({
  material,
  onChange,
}: {
  material: MaterialConfig;
  onChange: (material: MaterialConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Material</FieldLabel>
        <div className="grid grid-cols-[44px_1fr] gap-2">
          <input
            type="color"
            value={material.color}
            onChange={(event) =>
              onChange({ ...material, color: event.target.value })
            }
            className="h-9 w-11 cursor-pointer rounded-lg border border-zinc-800 bg-[#11141a] p-1"
            aria-label="Material color"
          />
          <input
            value={material.color}
            onChange={(event) =>
              onChange({ ...material, color: event.target.value })
            }
            className="h-9 rounded-lg border border-zinc-800 bg-[#11141a] px-3 font-mono text-xs text-zinc-200 outline-none focus:border-emerald-300/70"
            aria-label="Material hex"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <NumberInput
          label="metal"
          value={material.metalness}
          min={0}
          max={1}
          step={0.05}
          onChange={(value) => onChange({ ...material, metalness: value })}
        />
        <NumberInput
          label="rough"
          value={material.roughness}
          min={0}
          max={1}
          step={0.05}
          onChange={(value) => onChange({ ...material, roughness: value })}
        />
        <NumberInput
          label="alpha"
          value={material.opacity}
          min={0.05}
          max={1}
          step={0.05}
          onChange={(value) => onChange({ ...material, opacity: value })}
        />
      </div>

      <label className="flex h-10 items-center justify-between rounded-lg border border-zinc-800 bg-[#11141a] px-3 text-sm text-zinc-300">
        Wireframe
        <input
          type="checkbox"
          checked={material.wireframe}
          onChange={(event) =>
            onChange({ ...material, wireframe: event.target.checked })
          }
          className="h-4 w-4 accent-emerald-300"
        />
      </label>
    </div>
  );
}

function ObjectProperties({ object }: { object: SceneObject }) {
  const updateObject = useEditorStore((state) => state.updateObject);
  const deleteObject = useEditorStore((state) => state.deleteObject);
  const addKeyframe = useEditorStore((state) => state.addKeyframe);

  function updateVector(key: "position" | "rotation" | "scale", value: Vector3Tuple) {
    updateObject(object.id, { [key]: value });
  }

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel>Name</FieldLabel>
        <input
          value={object.name}
          onChange={(event) => updateObject(object.id, { name: event.target.value })}
          className="h-10 w-full rounded-lg border border-zinc-800 bg-[#11141a] px-3 text-sm text-zinc-100 outline-none focus:border-emerald-300/70"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex h-10 items-center justify-between rounded-lg border border-zinc-800 bg-[#11141a] px-3 text-sm text-zinc-300">
          Visible
          <input
            type="checkbox"
            checked={object.visible}
            onChange={(event) =>
              updateObject(object.id, { visible: event.target.checked })
            }
            className="h-4 w-4 accent-emerald-300"
          />
        </label>
        <label className="flex h-10 items-center justify-between rounded-lg border border-zinc-800 bg-[#11141a] px-3 text-sm text-zinc-300">
          Locked
          <input
            type="checkbox"
            checked={object.locked}
            onChange={(event) =>
              updateObject(object.id, { locked: event.target.checked })
            }
            className="h-4 w-4 accent-emerald-300"
          />
        </label>
      </div>

      <VectorEditor
        label="Position"
        value={object.position}
        onChange={(value) => updateVector("position", value)}
      />
      <VectorEditor
        label="Rotation"
        value={object.rotation}
        rotation
        onChange={(value) => updateVector("rotation", value)}
      />
      <VectorEditor
        label="Scale"
        value={object.scale}
        min={0.05}
        onChange={(value) => updateVector("scale", value)}
      />

      <MaterialEditor
        material={object.material}
        onChange={(material) => updateObject(object.id, { material })}
      />

      {object.type === "model" ? (
        <div>
          <FieldLabel>Model URL</FieldLabel>
          <textarea
            value={object.modelUrl ?? ""}
            onChange={(event) =>
              updateObject(object.id, { modelUrl: event.target.value })
            }
            rows={3}
            className="w-full resize-none rounded-lg border border-zinc-800 bg-[#11141a] px-3 py-2 font-mono text-xs text-zinc-200 outline-none focus:border-emerald-300/70"
          />
        </div>
      ) : null}

      <div>
        <FieldLabel>Keyframes</FieldLabel>
        <div className="grid grid-cols-3 gap-2">
          {(["position", "rotation", "scale"] as KeyframeChannel[]).map((channel) => (
            <button
              key={channel}
              type="button"
              onClick={() => addKeyframe(object.id, channel)}
              className="h-9 rounded-lg border border-zinc-800 bg-[#11141a] text-xs capitalize text-zinc-300 hover:border-emerald-300/60 hover:text-zinc-50"
            >
              {channel}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => deleteObject(object.id)}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-rose-400/30 bg-rose-400/10 text-sm text-rose-200 hover:bg-rose-400/15"
      >
        <Trash2 className="h-4 w-4" />
        Delete Object
      </button>
    </div>
  );
}

function UiBlockProperties({ block }: { block: UiBlock }) {
  const objects = useEditorStore((state) => state.objects);
  const updateUiBlock = useEditorStore((state) => state.updateUiBlock);
  const deleteUiBlock = useEditorStore((state) => state.deleteUiBlock);

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel>Label</FieldLabel>
        <input
          value={block.label}
          onChange={(event) =>
            updateUiBlock(block.id, { label: event.target.value })
          }
          className="h-10 w-full rounded-lg border border-zinc-800 bg-[#11141a] px-3 text-sm text-zinc-100 outline-none focus:border-amber-300/70"
        />
      </div>

      <div>
        <FieldLabel>Anchor</FieldLabel>
        <select
          value={block.anchorObjectId ?? ""}
          onChange={(event) =>
            updateUiBlock(block.id, {
              anchorObjectId: event.target.value || null,
            })
          }
          className="h-10 w-full rounded-lg border border-zinc-800 bg-[#11141a] px-3 text-sm text-zinc-100 outline-none focus:border-amber-300/70"
        >
          <option value="">Screen overlay</option>
          {objects.map((object) => (
            <option key={object.id} value={object.id}>
              {object.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <FieldLabel>Position</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="x"
            value={block.position.x}
            min={0}
            max={100}
            step={1}
            onChange={(value) =>
              updateUiBlock(block.id, {
                position: { ...block.position, x: value },
              })
            }
          />
          <NumberInput
            label="y"
            value={block.position.y}
            min={0}
            max={100}
            step={1}
            onChange={(value) =>
              updateUiBlock(block.id, {
                position: { ...block.position, y: value },
              })
            }
          />
        </div>
      </div>

      <div>
        <FieldLabel>Size</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="w"
            value={block.size.width}
            min={40}
            step={4}
            onChange={(value) =>
              updateUiBlock(block.id, {
                size: { ...block.size, width: value },
              })
            }
          />
          <NumberInput
            label="h"
            value={block.size.height}
            min={24}
            step={4}
            onChange={(value) =>
              updateUiBlock(block.id, {
                size: { ...block.size, height: value },
              })
            }
          />
        </div>
      </div>

      <div>
        <FieldLabel>Style</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="color"
            value={block.style.color}
            onChange={(event) =>
              updateUiBlock(block.id, {
                style: { ...block.style, color: event.target.value },
              })
            }
            className="h-10 w-full cursor-pointer rounded-lg border border-zinc-800 bg-[#11141a] p-1"
            aria-label="Text color"
          />
          <input
            type="color"
            value={rgbaToHex(block.style.background)}
            onChange={(event) =>
              updateUiBlock(block.id, {
                style: { ...block.style, background: event.target.value },
              })
            }
            className="h-10 w-full cursor-pointer rounded-lg border border-zinc-800 bg-[#11141a] p-1"
            aria-label="Background color"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          label="font"
          value={block.style.fontSize}
          min={10}
          max={56}
          step={1}
          onChange={(value) =>
            updateUiBlock(block.id, {
              style: { ...block.style, fontSize: value },
            })
          }
        />
        <NumberInput
          label="radius"
          value={block.style.radius}
          min={0}
          max={24}
          step={1}
          onChange={(value) =>
            updateUiBlock(block.id, {
              style: { ...block.style, radius: value },
            })
          }
        />
      </div>

      <button
        type="button"
        onClick={() => deleteUiBlock(block.id)}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-rose-400/30 bg-rose-400/10 text-sm text-rose-200 hover:bg-rose-400/15"
      >
        <Trash2 className="h-4 w-4" />
        Delete Block
      </button>
    </div>
  );
}

function rgbaToHex(value: string) {
  if (value.startsWith("#")) {
    return value.slice(0, 7);
  }

  const match = value.match(/\d+(\.\d+)?/g);
  if (!match || match.length < 3) {
    return "#111827";
  }

  return `#${match
    .slice(0, 3)
    .map((channel) => Number(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function PropertiesPanel() {
  const objects = useEditorStore((state) => state.objects);
  const uiBlocks = useEditorStore((state) => state.uiBlocks);
  const selectedObjectId = useEditorStore((state) => state.selectedObjectId);
  const selectedUiBlockId = useEditorStore((state) => state.selectedUiBlockId);
  const selectedObject = objects.find((object) => object.id === selectedObjectId);
  const selectedBlock = uiBlocks.find((block) => block.id === selectedUiBlockId);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-zinc-800/90 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-100">Properties</h2>
        <p className="mt-1 truncate text-xs text-zinc-500">
          {selectedObject?.name ?? selectedBlock?.label ?? "Nothing selected"}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {selectedObject ? <ObjectProperties object={selectedObject} /> : null}
        {!selectedObject && selectedBlock ? (
          <UiBlockProperties block={selectedBlock} />
        ) : null}
        {!selectedObject && !selectedBlock ? (
          <div className="rounded-lg border border-dashed border-zinc-800 p-5 text-sm text-zinc-500">
            Select an object or UI block.
          </div>
        ) : null}
      </div>
    </div>
  );
}
