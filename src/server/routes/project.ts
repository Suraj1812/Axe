import { Router } from "express";
import { optionalAuth, type AuthenticatedRequest } from "../middleware/auth";
import { parseSceneDocument } from "../../lib/scene-schema";
import { listProjects, loadProject, saveProject } from "../services/dataStore";

export const projectRouter = Router();

projectRouter.post(
  "/project",
  optionalAuth,
  async (request: AuthenticatedRequest, response, next) => {
    try {
      const parsedProject = parseSceneDocument(request.body);
      const project = await saveProject(parsedProject, request.user?.id ?? null);
      response.json({ project });
    } catch (error) {
      next(error);
    }
  },
);

projectRouter.get(
  "/projects",
  optionalAuth,
  async (request: AuthenticatedRequest, response, next) => {
    try {
      const projects = await listProjects(request.user?.id ?? null);
      response.json({ projects });
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
