import type { SceneDocument } from "@/lib/scene";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4200";

export type AuthResponse = {
  token: string;
  email: string;
};

export type ProjectSaveResponse = {
  project: SceneDocument;
  source: "api" | "local";
};

function projectKey(id: string) {
  return `axe-project-${id}`;
}

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
  try {
    const response = await fetch(`${API_BASE}/project`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify(project),
    });

    const payload = await parseResponse<{ project: SceneDocument }>(response);
    localStorage.setItem(projectKey(payload.project.id), JSON.stringify(payload.project));
    return { project: payload.project, source: "api" };
  } catch {
    localStorage.setItem(projectKey(project.id), JSON.stringify(project));
    return { project, source: "local" };
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
    localStorage.setItem(projectKey(payload.project.id), JSON.stringify(payload.project));
    return { project: payload.project, source: "api" };
  } catch {
    const cached = localStorage.getItem(projectKey(id));

    if (!cached) {
      throw new Error("Project not found locally or on the API");
    }

    return { project: JSON.parse(cached) as SceneDocument, source: "local" };
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
