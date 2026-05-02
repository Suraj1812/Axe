import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { createProjectSummary, type ProjectSummary, type SceneDocument } from "../../lib/scene";
import { safeParseSceneDocument } from "../../lib/scene-schema";
import { ProjectModel } from "../models/Project";
import { UserModel } from "../models/User";

type StoredUser = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

type StoredProject = {
  id: string;
  ownerId: string | null;
  project: SceneDocument;
  createdAt?: string;
  updatedAt?: string;
};

type LocalDb = {
  users: StoredUser[];
  projects: StoredProject[];
};

const localDbPath = path.join(process.cwd(), ".axe-data", "db.json");
let mongoPromise: Promise<typeof mongoose> | null = null;

function hasMongo() {
  return Boolean(process.env.MONGODB_URI);
}

async function connectMongo() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  mongoPromise ??= mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB ?? "axe",
  });

  return mongoPromise;
}

async function readLocalDb(): Promise<LocalDb> {
  try {
    const data = await fs.readFile(localDbPath, "utf8");
    return JSON.parse(data) as LocalDb;
  } catch {
    return { users: [], projects: [] };
  }
}

async function writeLocalDb(db: LocalDb) {
  await fs.mkdir(path.dirname(localDbPath), { recursive: true });
  const tempPath = `${localDbPath}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(db, null, 2));
  await fs.rename(tempPath, localDbPath);
}

export async function findUserByEmail(email: string) {
  const normalizedEmail = email.toLowerCase();

  if (hasMongo()) {
    await connectMongo();
    const user = await UserModel.findOne({ email: normalizedEmail }).lean();
    return user
      ? {
          id: String(user._id),
          email: user.email,
          passwordHash: user.passwordHash,
        }
      : null;
  }

  const db = await readLocalDb();
  const user = db.users.find((item) => item.email === normalizedEmail);
  return user ?? null;
}

export async function createUser(email: string, passwordHash: string) {
  const normalizedEmail = email.toLowerCase();

  if (hasMongo()) {
    await connectMongo();
    const user = await UserModel.create({
      email: normalizedEmail,
      passwordHash,
    });

    return {
      id: String(user._id),
      email: user.email,
      passwordHash: user.passwordHash,
    };
  }

  const db = await readLocalDb();
  const user: StoredUser = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  await writeLocalDb(db);
  return user;
}

export async function saveProject(scene: SceneDocument, ownerId: string | null) {
  const project = {
    ...scene,
    updatedAt: new Date().toISOString(),
  };

  if (hasMongo()) {
    await connectMongo();
    const saved = await ProjectModel.findOneAndUpdate(
      { projectId: project.id, ownerId },
      {
        projectId: project.id,
        ownerId,
        name: project.name,
        scene: project,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    return saved?.scene as SceneDocument;
  }

  const db = await readLocalDb();
  const existingIndex = db.projects.findIndex(
    (item) => item.id === project.id && item.ownerId === ownerId,
  );
  const existingProject =
    existingIndex >= 0 ? db.projects[existingIndex] : null;
  const record: StoredProject = {
    id: project.id,
    ownerId,
    project,
    createdAt: existingProject?.createdAt ?? project.updatedAt,
    updatedAt: project.updatedAt,
  };

  if (existingIndex >= 0) {
    db.projects[existingIndex] = record;
  } else {
    db.projects.push(record);
  }

  await writeLocalDb(db);
  return project;
}

export async function loadProject(id: string, ownerId: string | null) {
  if (hasMongo()) {
    await connectMongo();
    const ownedProject = ownerId
      ? await ProjectModel.findOne({ projectId: id, ownerId }).lean()
      : null;
    const guestProject = await ProjectModel.findOne({
      projectId: id,
      ownerId: null,
    }).lean();

    const scene = ownedProject?.scene ?? guestProject?.scene ?? null;
    const parsedScene = safeParseSceneDocument(scene);
    return parsedScene.success ? parsedScene.data : null;
  }

  const db = await readLocalDb();
  const ownedProject = ownerId
    ? db.projects.find((item) => item.id === id && item.ownerId === ownerId)
    : null;
  const guestProject = db.projects.find(
    (item) => item.id === id && item.ownerId === null,
  );

  const scene = ownedProject?.project ?? guestProject?.project ?? null;
  const parsedScene = safeParseSceneDocument(scene);
  return parsedScene.success ? parsedScene.data : null;
}

function safeSummary(input: unknown, scope: ProjectSummary["scope"]) {
  const parsedScene = safeParseSceneDocument(input);

  if (!parsedScene.success) {
    return null;
  }

  return createProjectSummary(parsedScene.data, scope);
}

export async function listProjects(ownerId: string | null): Promise<ProjectSummary[]> {
  if (hasMongo()) {
    await connectMongo();
    const query = ownerId
      ? { ownerId: { $in: [ownerId, null] } }
      : { ownerId: null };
    const records = await ProjectModel.find(query)
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    return records
      .map((record) => safeSummary(record.scene, record.ownerId ? "account" : "local"))
      .filter((project) => project !== null)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }

  const db = await readLocalDb();
  const projects = db.projects.filter((project) =>
    ownerId ? project.ownerId === ownerId || project.ownerId === null : project.ownerId === null,
  );

  return projects
    .map((record) => safeSummary(record.project, record.ownerId ? "account" : "local"))
    .filter((project) => project !== null)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 50);
}
