import { Router } from "express";
import type { SceneDocument } from "../../lib/scene";
import { optionalAuth, type AuthenticatedRequest } from "../middleware/auth";
import { loadProject, saveProject } from "../services/dataStore";

export const projectRouter = Router();

function isSceneDocument(value: unknown): value is SceneDocument {
  const candidate = value as Partial<SceneDocument>;
  return Boolean(
    candidate &&
      typeof candidate.id === "string" &&
      typeof candidate.name === "string" &&
      Array.isArray(candidate.objects) &&
      Array.isArray(candidate.keyframes) &&
      Array.isArray(candidate.uiBlocks) &&
      typeof candidate.duration === "number",
  );
}

projectRouter.post(
  "/project",
  optionalAuth,
  async (request: AuthenticatedRequest, response, next) => {
    try {
      if (!isSceneDocument(request.body)) {
        response.status(400).json({ message: "Invalid scene payload" });
        return;
      }

      const project = await saveProject(request.body, request.user?.id ?? null);
      response.json({ project });
    } catch (error) {
      next(error);
    }
  },
);

projectRouter.get(
  "/project/:id",
  optionalAuth,
  async (request: AuthenticatedRequest, response, next) => {
    try {
      const projectId = Array.isArray(request.params.id)
        ? request.params.id[0]
        : request.params.id;
      const project = await loadProject(projectId, request.user?.id ?? null);

      if (!project) {
        response.status(404).json({ message: "Project not found" });
        return;
      }

      response.json({ project });
    } catch (error) {
      next(error);
    }
  },
);
