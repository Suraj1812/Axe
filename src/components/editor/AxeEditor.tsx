"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { SceneHierarchy } from "@/components/editor/SceneHierarchy";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { TimelinePanel } from "@/components/editor/TimelinePanel";
import { Toolbar } from "@/components/editor/Toolbar";

const EditorCanvas = dynamic(
  () => import("@/components/three/EditorCanvas").then((mod) => mod.EditorCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#0b0d10] text-sm text-zinc-400">
        Loading canvas
      </div>
    ),
  },
);

export function AxeEditor() {
  return (
    <main className="grid h-screen min-w-[1180px] grid-rows-[56px_1fr_168px] bg-[#08090b] text-zinc-100">
      <Toolbar />
      <div className="grid min-h-0 grid-cols-[286px_1fr_360px] border-y border-zinc-800/90">
        <motion.aside
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="min-h-0 border-r border-zinc-800/90 bg-[#0d0f13]"
        >
          <SceneHierarchy />
        </motion.aside>

        <section className="relative min-w-0 overflow-hidden bg-[#090a0d]">
          <EditorCanvas />
        </section>

        <motion.aside
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="min-h-0 border-l border-zinc-800/90 bg-[#0d0f13]"
        >
          <PropertiesPanel />
        </motion.aside>
      </div>
      <TimelinePanel />
    </main>
  );
}
