"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Download,
  FolderOpen,
  Loader2,
  LogIn,
  Move,
  Redo2,
  RotateCw,
  Save,
  Scaling,
  Undo2,
  UserPlus,
} from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import {
  exportProject,
  getApiHealth,
  listProjects,
  loadProject,
  login,
  register,
  saveProject,
} from "@/services/projects";
import type { ProjectSummary, TransformMode } from "@/lib/scene";

const modeButtons: Array<{
  mode: TransformMode;
  title: string;
  icon: typeof Move;
}> = [
  { mode: "translate", title: "Move", icon: Move },
  { mode: "rotate", title: "Rotate", icon: RotateCw },
  { mode: "scale", title: "Scale", icon: Scaling },
];

export function Toolbar() {
  const projectId = useEditorStore((state) => state.projectId);
  const projectName = useEditorStore((state) => state.projectName);
  const transformMode = useEditorStore((state) => state.transformMode);
  const authToken = useEditorStore((state) => state.authToken);
  const userEmail = useEditorStore((state) => state.userEmail);
  const setTransformMode = useEditorStore((state) => state.setTransformMode);
  const serializeScene = useEditorStore((state) => state.serializeScene);
  const hydrateScene = useEditorStore((state) => state.hydrateScene);
  const setProjectMeta = useEditorStore((state) => state.setProjectMeta);
  const setAuth = useEditorStore((state) => state.setAuth);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useEditorStore((state) => state.past.length > 0);
  const canRedo = useEditorStore((state) => state.future.length > 0);

  const [email, setEmail] = useState(userEmail ?? "designer@axe.dev");
  const [password, setPassword] = useState("axe-studio");
  const [status, setStatus] = useState("Local state ready");
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">(
    "checking",
  );
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [busy, setBusy] = useState<"save" | "load" | "auth" | null>(null);

  const signedInLabel = useMemo(
    () => (userEmail ? userEmail.split("@")[0] : "Guest"),
    [userEmail],
  );
  const apiStatusLabel =
    apiStatus === "online"
      ? "API online"
      : apiStatus === "offline"
        ? "Offline mode"
        : "Checking API";

  const refreshProjects = useCallback(async () => {
    const nextProjects = await listProjects(authToken);
    setProjects(nextProjects);
  }, [authToken]);

  useEffect(() => {
    let cancelled = false;

    async function checkApi() {
      try {
        await getApiHealth();

        if (!cancelled) {
          setApiStatus("online");
        }
      } catch {
        if (!cancelled) {
          setApiStatus("offline");
        }
      }
    }

    checkApi();
    const refreshTimer = window.setTimeout(() => {
      void refreshProjects();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(refreshTimer);
    };
  }, [authToken, refreshProjects]);

  async function handleSave() {
    if (busy) {
      return;
    }

    setBusy("save");
    setStatus("Saving project");
    const scene = { ...serializeScene(), id: projectId, name: projectName };

    try {
      const result = await saveProject(scene, authToken);
      hydrateScene(result.project);
      setProjectMeta(result.project.id, result.project.name);
      await refreshProjects();
      setStatus(result.source === "api" ? "Saved to API" : "Saved locally");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleLoad(id = projectId) {
    if (busy) {
      return;
    }

    setBusy("load");
    setStatus("Loading project");

    try {
      const result = await loadProject(id, authToken);
      hydrateScene(result.project);
      await refreshProjects();
      setStatus(result.source === "api" ? "Loaded from API" : "Loaded locally");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Load failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleAuth(mode: "login" | "register") {
    if (busy) {
      return;
    }

    setBusy("auth");
    setStatus(mode === "login" ? "Signing in" : "Creating account");

    try {
      const result =
        mode === "login" ? await login(email, password) : await register(email, password);
      setAuth(result.token, result.email);
      setProjects(await listProjects(result.token));
      setStatus(mode === "login" ? "Signed in" : "Account ready");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Auth failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <header className="grid min-w-0 grid-cols-[272px_minmax(0,1fr)_328px] border-b border-zinc-800/90 bg-[#0b0c10]/95 shadow-sm shadow-black/30">
      <div className="flex min-w-0 items-center gap-3 border-r border-zinc-800/90 px-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-300/30 bg-emerald-300/10 font-semibold text-emerald-200 shadow-inner shadow-emerald-300/10">
          A
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-zinc-50">Axe</div>
          <div className="truncate text-xs text-zinc-500">3D Web Builder</div>
        </div>
      </div>

      <div className="axe-scrollbar-none flex min-w-0 items-center gap-2 overflow-x-auto px-4">
        <div className="flex h-9 shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-[#11141a] shadow-sm shadow-black/20">
          {modeButtons.map(({ mode, title, icon: Icon }) => (
            <button
              key={mode}
              title={title}
              type="button"
              onClick={() => setTransformMode(mode)}
              className={`flex h-9 w-9 items-center justify-center border-r border-zinc-800 last:border-r-0 ${
                transformMode === mode
                  ? "bg-emerald-300 text-[#06110e] shadow-inner shadow-white/20"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        <div className="flex h-9 shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-[#11141a] shadow-sm shadow-black/20">
          <button
            title="Undo"
            type="button"
            disabled={!canUndo}
            onClick={undo}
            className="flex h-9 w-9 items-center justify-center border-r border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-35"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            title="Redo"
            type="button"
            disabled={!canRedo}
            onClick={redo}
            className="flex h-9 w-9 items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-35"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        <input
          value={projectName}
          onChange={(event) => {
            setProjectMeta(projectId, event.target.value);
          }}
          className="axe-control h-9 w-40 rounded-lg px-3 text-sm outline-none"
          aria-label="Project name"
        />
        <input
          value={projectId}
          onChange={(event) => {
            setProjectMeta(event.target.value, projectName);
          }}
          className="axe-control h-9 w-32 rounded-lg px-3 font-mono text-xs text-zinc-300 outline-none"
          aria-label="Project id"
        />
        <select
          value=""
          onFocus={refreshProjects}
          onChange={(event) => {
            if (event.target.value) {
              void handleLoad(event.target.value);
            }
          }}
          disabled={busy !== null}
          className="axe-control h-9 w-32 rounded-lg px-2 text-xs text-zinc-300 outline-none disabled:opacity-50"
          aria-label="Recent projects"
          title="Recent projects"
        >
          <option value="">Recent</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name} · {project.scope}
            </option>
          ))}
        </select>

        <button
          title="Save"
          type="button"
          onClick={handleSave}
          disabled={busy !== null}
          className="flex h-9 shrink-0 items-center gap-2 rounded-lg bg-emerald-300 px-3 text-sm font-medium text-[#06110e] shadow-sm shadow-emerald-950/40 hover:bg-emerald-200 disabled:opacity-60"
        >
          {busy === "save" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </button>
        <button
          title="Load"
          type="button"
          onClick={() => handleLoad()}
          disabled={busy !== null}
          aria-label="Load"
          className="flex h-9 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-60"
        >
          {busy === "load" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FolderOpen className="h-4 w-4" />
          )}
        </button>
        <button
          title="Export JSON"
          type="button"
          onClick={() => exportProject(serializeScene())}
          className="flex h-9 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
        >
          <Download className="h-4 w-4" />
        </button>
        <div className="flex min-w-20 flex-1 items-center gap-2 truncate rounded-lg border border-transparent px-1 text-xs text-zinc-500">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              apiStatus === "online"
                ? "bg-emerald-300"
                : apiStatus === "offline"
                  ? "bg-rose-300"
                  : "bg-amber-300"
            }`}
          />
          <span className="hidden shrink-0 text-zinc-400 xl:inline">{apiStatusLabel}</span>
          <span className="hidden h-3 w-px shrink-0 bg-zinc-800 xl:block" />
          <span className="truncate">{status}</span>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-2 border-l border-zinc-800/90 px-4">
        <div className="mr-1 hidden max-w-20 truncate text-xs text-zinc-500 2xl:block">
          {signedInLabel}
        </div>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="axe-control h-9 min-w-0 flex-1 rounded-lg px-3 text-xs text-zinc-200 outline-none"
          aria-label="Email"
        />
        <input
          value={password}
          type="password"
          onChange={(event) => setPassword(event.target.value)}
          className="axe-control h-9 w-24 rounded-lg px-3 text-xs text-zinc-200 outline-none"
          aria-label="Password"
        />
        <button
          title="Register"
          type="button"
          onClick={() => handleAuth("register")}
          disabled={busy !== null}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-60"
        >
          {busy === "auth" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
        </button>
        <button
          title="Login"
          type="button"
          onClick={() => handleAuth("login")}
          disabled={busy !== null}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-60"
        >
          <LogIn className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
