"use client";

import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Box,
  Circle,
  Eye,
  EyeOff,
  MousePointerClick,
  Plus,
  Square,
  Trash2,
  Type,
  Upload,
} from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import type { SceneObjectType } from "@/lib/scene";

const primitiveButtons: Array<{
  type: SceneObjectType;
  label: string;
  icon: typeof Box;
}> = [
  { type: "box", label: "Box", icon: Box },
  { type: "sphere", label: "Sphere", icon: Circle },
  { type: "plane", label: "Plane", icon: Square },
];

function ObjectIcon({ type }: { type: SceneObjectType }) {
  if (type === "sphere") return <Circle className="h-4 w-4" />;
  if (type === "plane") return <Square className="h-4 w-4" />;
  if (type === "model") return <Upload className="h-4 w-4" />;
  return <Box className="h-4 w-4" />;
}

export function SceneHierarchy() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objects = useEditorStore((state) => state.objects);
  const uiBlocks = useEditorStore((state) => state.uiBlocks);
  const selectedObjectId = useEditorStore((state) => state.selectedObjectId);
  const selectedUiBlockId = useEditorStore((state) => state.selectedUiBlockId);
  const addObject = useEditorStore((state) => state.addObject);
  const updateObject = useEditorStore((state) => state.updateObject);
  const deleteObject = useEditorStore((state) => state.deleteObject);
  const selectObject = useEditorStore((state) => state.selectObject);
  const addUiBlock = useEditorStore((state) => state.addUiBlock);
  const selectUiBlock = useEditorStore((state) => state.selectUiBlock);
  const deleteUiBlock = useEditorStore((state) => state.deleteUiBlock);

  function handleUpload(file: File | undefined) {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      addObject("model", {
        name: file.name.replace(/\.(glb|gltf)$/i, ""),
        modelUrl: String(reader.result),
      });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-zinc-800/90 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase text-zinc-500">
            Scene
          </h2>
          <span className="font-mono text-[11px] text-zinc-600">
            {objects.length} objects
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {primitiveButtons.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => addObject(type)}
              className="flex h-16 flex-col items-center justify-center gap-1 rounded-lg border border-zinc-800 bg-[#12151b] text-xs text-zinc-300 hover:border-emerald-300/60 hover:text-zinc-50"
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".glb,.gltf,model/gltf+json,model/gltf-binary"
          className="hidden"
          onChange={(event) => {
            handleUpload(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-[#12151b] text-sm text-zinc-300 hover:border-emerald-300/60 hover:text-zinc-50"
        >
          <Upload className="h-4 w-4" />
          Import GLB
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <AnimatePresence initial={false}>
          {objects.map((object) => {
            const selected = selectedObjectId === object.id;

            return (
              <motion.div
                key={object.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={`group mb-2 flex h-11 items-center gap-2 rounded-lg border px-2 ${
                  selected
                    ? "border-emerald-300/70 bg-emerald-300/10"
                    : "border-zinc-800 bg-[#11141a] hover:border-zinc-700"
                }`}
              >
                <button
                  type="button"
                  onClick={() => selectObject(object.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800"
                    style={{ color: object.material.color }}
                  >
                    <ObjectIcon type={object.type} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-zinc-200">
                      {object.name}
                    </span>
                    <span className="block truncate text-[11px] text-zinc-600">
                      {object.type}
                    </span>
                  </span>
                </button>

                <button
                  title={object.visible ? "Hide" : "Show"}
                  type="button"
                  onClick={() =>
                    updateObject(object.id, { visible: !object.visible })
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100"
                >
                  {object.visible ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
                <button
                  title="Delete"
                  type="button"
                  onClick={() => deleteObject(object.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-rose-400/10 hover:text-rose-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="border-t border-zinc-800/90 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase text-zinc-500">
            UI Blocks
          </h2>
          <div className="flex gap-1">
            <button
              title="Add text"
              type="button"
              onClick={() => addUiBlock("text")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
            >
              <Type className="h-4 w-4" />
            </button>
            <button
              title="Add button"
              type="button"
              onClick={() => addUiBlock("button")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {uiBlocks.map((block) => (
            <div
              key={block.id}
              className={`flex h-10 items-center gap-2 rounded-lg border px-2 ${
                selectedUiBlockId === block.id
                  ? "border-amber-300/70 bg-amber-300/10"
                  : "border-zinc-800 bg-[#11141a]"
              }`}
            >
              <button
                type="button"
                onClick={() => selectUiBlock(block.id)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm text-zinc-300"
              >
                <MousePointerClick className="h-4 w-4 text-amber-300" />
                <span className="truncate">{block.label}</span>
              </button>
              <button
                title="Delete"
                type="button"
                onClick={() => deleteUiBlock(block.id)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-rose-400/10 hover:text-rose-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
