import {
  createProjectSummary,
  type ProjectSummary,
  type SceneDocument,
} from "@/lib/scene";
import { parseSceneDocument } from "@/lib/scene-schema";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4200";

export type AuthResponse = {
  token: string;
  email: string;
};

export type ProjectSaveResponse = {
  project: SceneDocument;
  source: "api" | "local";
};

export type ApiHealth = {
  ok: boolean;
  persistence: "mongodb" | "local";
};

function projectKey(id: string) {
  return `axe-project-${id}`;
}

const localProjectIndexKey = "axe-project-index";

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message ?? "Request failed");
  }

  return payload as T;
}

function readLocalProjectIndex(): ProjectSummary[] {
  const raw = localStorage.getItem(localProjectIndexKey);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as ProjectSummary[];
  } catch {
    return [];
  }
}

function rememberProject(project: SceneDocument) {
  localStorage.setItem(projectKey(project.id), JSON.stringify(project));
  const summary = createProjectSummary(project, "local");
  const nextIndex = [
    summary,
    ...readLocalProjectIndex().filter((item) => item.id !== project.id),
  ].slice(0, 50);
  localStorage.setItem(localProjectIndexKey, JSON.stringify(nextIndex));
}

function readLocalProject(id: string) {
  const cached = localStorage.getItem(projectKey(id));

  if (!cached) {
    return null;
  }

  return parseSceneDocument(JSON.parse(cached));
}

export async function getApiHealth() {
  const response = await fetch(`${API_BASE}/health`);
  return parseResponse<ApiHealth>(response);
}

export async function register(email: string, password: string) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return parseResponse<AuthResponse>(response);
}

export async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return parseResponse<AuthResponse>(response);
}

export async function saveProject(
  project: SceneDocument,
  token: string | null,
): Promise<ProjectSaveResponse> {
  const validProject = parseSceneDocument(project);

  try {
    const response = await fetch(`${API_BASE}/project`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify(validProject),
    });

    const payload = await parseResponse<{ project: SceneDocument }>(response);
    const parsedProject = parseSceneDocument(payload.project);
    rememberProject(parsedProject);
    return { project: parsedProject, source: "api" };
  } catch {
    rememberProject(validProject);
    return { project: validProject, source: "local" };
  }
}

export async function loadProject(
  id: string,
  token: string | null,
): Promise<ProjectSaveResponse> {
  try {
    const response = await fetch(`${API_BASE}/project/${encodeURIComponent(id)}`, {
      headers: authHeaders(token),
    });
    const payload = await parseResponse<{ project: SceneDocument }>(response);
    const parsedProject = parseSceneDocument(payload.project);
    rememberProject(parsedProject);
    return { project: parsedProject, source: "api" };
  } catch {
    const cached = readLocalProject(id);

    if (!cached) {
      throw new Error("Project not found locally or on the API");
    }

    return { project: cached, source: "local" };
  }
}

export async function listProjects(token: string | null): Promise<ProjectSummary[]> {
  const localProjects = readLocalProjectIndex();

  try {
    const response = await fetch(`${API_BASE}/projects`, {
      headers: authHeaders(token),
    });
    const payload = await parseResponse<{ projects: ProjectSummary[] }>(response);
    const merged = [...payload.projects, ...localProjects];
    return Array.from(
      new Map(merged.map((project) => [project.id, project])).values(),
    ).sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  } catch {
    return localProjects;
  }
}

export function exportProject(project: SceneDocument) {
  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${project.name.toLowerCase().replace(/\s+/g, "-")}.axe.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
