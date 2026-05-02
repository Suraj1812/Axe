"use client";

import { useEffect } from "react";
import { Clock3, Pause, Play, SkipBack, Trash2 } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";

export function TimelinePanel() {
  const objects = useEditorStore((state) => state.objects);
  const keyframes = useEditorStore((state) => state.keyframes);
  const currentTime = useEditorStore((state) => state.currentTime);
  const duration = useEditorStore((state) => state.duration);
  const isPlaying = useEditorStore((state) => state.isPlaying);
  const scrollAnimationEnabled = useEditorStore((state) => state.scrollAnimationEnabled);
  const setCurrentTime = useEditorStore((state) => state.setCurrentTime);
  const setDuration = useEditorStore((state) => state.setDuration);
  const setPlaying = useEditorStore((state) => state.setPlaying);
  const setScrollAnimationEnabled = useEditorStore(
    (state) => state.setScrollAnimationEnabled,
  );
  const updateKeyframe = useEditorStore((state) => state.updateKeyframe);
  const deleteKeyframe = useEditorStore((state) => state.deleteKeyframe);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    let frameId = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const store = useEditorStore.getState();
      const delta = (now - last) / 1000;
      last = now;
      store.setCurrentTime((store.currentTime + delta) % store.duration);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [isPlaying]);

  const playheadPercent = `${(currentTime / duration) * 100}%`;
  const visibleTrackCount = Math.max(objects.length, 1);

  return (
    <footer className="grid min-h-0 grid-cols-[272px_minmax(440px,1fr)_328px] bg-[#0b0c10]">
      <div className="border-r border-zinc-800/90 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <Clock3 className="h-4 w-4 text-emerald-300" />
            Timeline
          </div>
          <span className="font-mono text-xs text-zinc-500">
            {currentTime.toFixed(2)}s
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            title="Restart"
            type="button"
            onClick={() => setCurrentTime(0)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            title={isPlaying ? "Pause" : "Play"}
            type="button"
            onClick={() => setPlaying(!isPlaying)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-300 text-[#06110e] hover:bg-emerald-200"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>
          <label className="ml-2 flex items-center gap-2 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={scrollAnimationEnabled}
              onChange={(event) =>
                setScrollAnimationEnabled(event.target.checked)
              }
              className="h-4 w-4 accent-emerald-300"
            />
            Scroll
          </label>
        </div>
        <div className="mt-4 grid grid-cols-[1fr_72px] gap-2">
          <input
            type="range"
            value={currentTime}
            min={0}
            max={duration}
            step={0.01}
            onChange={(event) => setCurrentTime(Number(event.target.value))}
            className="accent-emerald-300"
          />
          <input
            type="number"
            value={duration}
            min={1}
            max={30}
            step={1}
            onChange={(event) => setDuration(Number(event.target.value))}
            className="axe-control h-8 rounded-lg px-2 font-mono text-xs text-zinc-200 outline-none"
            aria-label="Duration"
          />
        </div>
      </div>

      <div className="axe-scrollbar-thin relative min-w-0 overflow-auto border-r border-zinc-800/90 p-4">
        <div className="relative h-full min-h-[132px] min-w-[680px] rounded-lg border border-zinc-800 bg-[#0f1117] shadow-inner shadow-black/20">
          <div
            className="absolute bottom-0 top-0 z-20 w-px bg-emerald-300"
            style={{ left: playheadPercent }}
          />
          <div
            className="absolute top-0 z-20 h-3 w-3 -translate-x-1/2 rounded-full bg-emerald-300"
            style={{ left: playheadPercent }}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 grid grid-cols-5 border-b border-zinc-800/70">
            {Array.from({ length: 5 }).map((_, index) => (
              <span
                key={index}
                className="h-6 border-l border-zinc-800/50 pl-2 pt-1 font-mono text-[10px] text-zinc-600 first:border-l-0"
              >
                {((duration / 4) * index).toFixed(0)}s
              </span>
            ))}
          </div>
          <div
            className="grid h-full pt-6"
            style={{ gridTemplateRows: `repeat(${visibleTrackCount}, minmax(30px, 1fr))` }}
          >
            {objects.map((object) => (
              <div
                key={object.id}
                className="relative border-b border-zinc-800/70 last:border-b-0"
              >
                <span className="absolute left-3 top-2 z-10 max-w-36 truncate text-xs text-zinc-500">
                  {object.name}
                </span>
                {keyframes
                  .filter((frame) => frame.objectId === object.id)
                  .map((frame) => (
                    <button
                      key={frame.id}
                      type="button"
                      title={`${frame.channel} ${frame.time.toFixed(2)}s`}
                      onClick={() => updateKeyframe(frame.id, { time: currentTime })}
                      className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[3px] border border-[#0f1117] bg-amber-300 shadow-sm shadow-black/40 hover:bg-amber-200"
                      style={{ left: `${(frame.time / duration) * 100}%` }}
                    />
                  ))}
              </div>
            ))}
            {objects.length === 0 ? (
              <div className="flex items-center px-3 text-xs text-zinc-600">
                No timeline tracks
              </div>
            ) : null}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 top-0 grid grid-cols-8">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="border-l border-zinc-800/50" />
            ))}
          </div>
        </div>
      </div>

      <div className="axe-scrollbar-thin min-h-0 overflow-y-auto p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="axe-muted-label text-xs font-semibold uppercase">
            Keyframes
          </h2>
          <span className="font-mono text-[11px] text-zinc-600">
            {keyframes.length}
          </span>
        </div>
        <div className="space-y-2">
          {keyframes.slice(0, 5).map((frame) => {
            const object = objects.find((item) => item.id === frame.objectId);

            return (
              <div
                key={frame.id}
                className="grid grid-cols-[1fr_68px_28px] items-center gap-2 rounded-lg border border-zinc-800 bg-[#11141a] p-2 shadow-sm shadow-black/10"
              >
                <div className="min-w-0">
                  <div className="truncate text-xs text-zinc-300">
                    {object?.name ?? "Missing object"}
                  </div>
                  <div className="font-mono text-[11px] text-zinc-600">
                    {frame.channel}
                  </div>
                </div>
                <input
                  type="number"
                  value={Number(frame.time.toFixed(2))}
                  min={0}
                  max={duration}
                  step={0.1}
                  onChange={(event) =>
                    updateKeyframe(frame.id, {
                      time: Number(event.target.value),
                    })
                  }
                  className="axe-control h-8 rounded-lg px-2 font-mono text-xs text-zinc-200 outline-none"
                  aria-label="Keyframe time"
                />
                <button
                  title="Delete keyframe"
                  type="button"
                  onClick={() => deleteKeyframe(frame.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-rose-400/10 hover:text-rose-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
          {keyframes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-800 px-3 py-4 text-center text-sm text-zinc-500">
              No keyframes
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
