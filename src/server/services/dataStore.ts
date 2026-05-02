import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import type { SceneDocument } from "../../lib/scene";
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
  await fs.writeFile(localDbPath, JSON.stringify(db, null, 2));
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
  const record: StoredProject = { id: project.id, ownerId, project };

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

    return (ownedProject?.scene ?? guestProject?.scene ?? null) as
      | SceneDocument
      | null;
  }

  const db = await readLocalDb();
  const ownedProject = ownerId
    ? db.projects.find((item) => item.id === id && item.ownerId === ownerId)
    : null;
  const guestProject = db.projects.find(
    (item) => item.id === id && item.ownerId === null,
  );

  return ownedProject?.project ?? guestProject?.project ?? null;
}
