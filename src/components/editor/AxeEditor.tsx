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
      <div className="flex h-full w-full items-center justify-center bg-[#090a0d] text-sm text-zinc-400">
        <div className="h-8 w-8 animate-spin rounded-full border border-zinc-800 border-t-emerald-300" />
      </div>
    ),
  },
);

export function AxeEditor() {
  return (
    <>
      <div className="axe-mobile-guard h-dvh items-center justify-center bg-[#08090b] p-6 text-center text-zinc-100">
        <div className="max-w-sm rounded-lg border border-zinc-800 bg-[#0d0f13] p-6 shadow-2xl shadow-black/40">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-300/30 bg-emerald-300/10 font-semibold text-emerald-200">
            A
          </div>
          <h1 className="text-lg font-semibold">Axe works best on desktop</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Use a wider browser window to edit 3D scenes, timelines, and panels.
          </p>
        </div>
      </div>
      <main className="axe-desktop-shell h-dvh min-w-[1040px] grid-rows-[60px_minmax(0,1fr)_180px] overflow-hidden bg-[#08090b] text-zinc-100">
        <Toolbar />
        <div className="grid min-h-0 grid-cols-[272px_minmax(440px,1fr)_328px] border-y border-zinc-800/90">
          <motion.aside
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="min-h-0 border-r border-zinc-800/90 bg-[#0c0e12]"
          >
            <SceneHierarchy />
          </motion.aside>

          <section className="relative min-w-0 overflow-hidden bg-[#090a0d]">
            <EditorCanvas />
          </section>

          <motion.aside
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="min-h-0 border-l border-zinc-800/90 bg-[#0c0e12]"
          >
            <PropertiesPanel />
          </motion.aside>
        </div>
        <TimelinePanel />
      </main>
    </>
  );
}
