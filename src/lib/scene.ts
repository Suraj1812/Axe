export type SceneObjectType = "box" | "sphere" | "plane" | "model";
export type TransformMode = "translate" | "rotate" | "scale";
export type Vector3Tuple = [number, number, number];
export type KeyframeChannel = "position" | "rotation" | "scale";
export type UiBlockType = "text" | "button";
export type ProjectSummary = {
  id: string;
  name: string;
  objectCount: number;
  uiBlockCount: number;
  keyframeCount: number;
  updatedAt: string;
  scope: "account" | "local";
};

export type MaterialConfig = {
  color: string;
  metalness: number;
  roughness: number;
  opacity: number;
  wireframe: boolean;
};

export type SceneObject = {
  id: string;
  name: string;
  type: SceneObjectType;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
  material: MaterialConfig;
  modelUrl?: string | null;
  visible: boolean;
  locked: boolean;
};

export type SceneKeyframe = {
  id: string;
  objectId: string;
  channel: KeyframeChannel;
  time: number;
  value: Vector3Tuple;
  easing: "linear" | "power2.out";
};

export type UiBlock = {
  id: string;
  type: UiBlockType;
  label: string;
  anchorObjectId: string | null;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  style: {
    color: string;
    background: string;
    fontSize: number;
    radius: number;
  };
};

export type SceneDocument = {
  id: string;
  name: string;
  objects: SceneObject[];
  keyframes: SceneKeyframe[];
  uiBlocks: UiBlock[];
  duration: number;
  updatedAt: string;
};

const primitiveColors: Record<SceneObjectType, string> = {
  box: "#24d6a3",
  sphere: "#f3c969",
  plane: "#8ea0ff",
  model: "#f77f9a",
};

export function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }

  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createSceneObject(
  type: SceneObjectType,
  overrides: Partial<SceneObject> = {},
): SceneObject {
  const id = overrides.id ?? makeId(type);

  return {
    id,
    name:
      overrides.name ??
      `${type.charAt(0).toUpperCase()}${type.slice(1)} ${id.slice(-4)}`,
    type,
    position: overrides.position ?? [0, type === "plane" ? -0.5 : 0.5, 0],
    rotation: overrides.rotation ?? [type === "plane" ? -Math.PI / 2 : 0, 0, 0],
    scale: overrides.scale ?? [1, 1, 1],
    material: overrides.material ?? {
      color: primitiveColors[type],
      metalness: 0.12,
      roughness: 0.46,
      opacity: 1,
      wireframe: false,
    },
    modelUrl: overrides.modelUrl ?? null,
    visible: overrides.visible ?? true,
    locked: overrides.locked ?? false,
  };
}

export function createUiBlock(type: UiBlockType): UiBlock {
  const id = makeId(type);

  return {
    id,
    type,
    label: type === "button" ? "Launch" : "Immersive headline",
    anchorObjectId: null,
    position: type === "button" ? { x: 56, y: 64 } : { x: 50, y: 16 },
    size:
      type === "button"
        ? { width: 128, height: 44 }
        : { width: 320, height: 56 },
    style: {
      color: "#f8fafc",
      background:
        type === "button" ? "rgba(36, 214, 163, 0.9)" : "rgba(8, 9, 11, 0)",
      fontSize: type === "button" ? 15 : 28,
      radius: type === "button" ? 8 : 0,
    },
  };
}

export function createDefaultScene(): SceneDocument {
  const heroCube = createSceneObject("box", {
    id: "obj_hero_cube",
    name: "Hero cube",
    position: [-1.2, 0.7, 0],
    rotation: [0.2, 0.4, 0],
    material: {
      color: "#24d6a3",
      metalness: 0.18,
      roughness: 0.38,
      opacity: 1,
      wireframe: false,
    },
  });

  const accentSphere = createSceneObject("sphere", {
    id: "obj_accent_sphere",
    name: "Accent sphere",
    position: [1.15, 0.65, -0.6],
    scale: [0.72, 0.72, 0.72],
    material: {
      color: "#f3c969",
      metalness: 0.08,
      roughness: 0.4,
      opacity: 1,
      wireframe: false,
    },
  });

  const stage = createSceneObject("plane", {
    id: "obj_stage_plane",
    name: "Stage plane",
    position: [0, -0.02, 0],
    scale: [4.5, 4.5, 1],
    material: {
      color: "#3f4654",
      metalness: 0,
      roughness: 0.7,
      opacity: 0.62,
      wireframe: false,
    },
  });

  return {
    id: "axe-starter",
    name: "Axe starter scene",
    objects: [heroCube, accentSphere, stage],
    keyframes: [
      {
        id: "kf_cube_start",
        objectId: heroCube.id,
        channel: "rotation",
        time: 0,
        value: heroCube.rotation,
        easing: "linear",
      },
      {
        id: "kf_cube_end",
        objectId: heroCube.id,
        channel: "rotation",
        time: 4,
        value: [0.2, Math.PI * 1.5, 0.15],
        easing: "power2.out",
      },
      {
        id: "kf_sphere_start",
        objectId: accentSphere.id,
        channel: "position",
        time: 0,
        value: accentSphere.position,
        easing: "linear",
      },
      {
        id: "kf_sphere_end",
        objectId: accentSphere.id,
        channel: "position",
        time: 4,
        value: [1.15, 1.55, -0.6],
        easing: "power2.out",
      },
    ],
    uiBlocks: [
      {
        id: "ui_headline",
        type: "text",
        label: "Design in 3D",
        anchorObjectId: null,
        position: { x: 50, y: 12 },
        size: { width: 320, height: 60 },
        style: {
          color: "#f8fafc",
          background: "rgba(8, 9, 11, 0)",
          fontSize: 30,
          radius: 0,
        },
      },
      {
        id: "ui_cta",
        type: "button",
        label: "Preview",
        anchorObjectId: heroCube.id,
        position: { x: 50, y: 52 },
        size: { width: 128, height: 42 },
        style: {
          color: "#09110f",
          background: "rgba(36, 214, 163, 0.95)",
          fontSize: 15,
          radius: 8,
        },
      },
    ],
    duration: 4,
    updatedAt: new Date().toISOString(),
  };
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function lerpTuple(
  from: Vector3Tuple,
  to: Vector3Tuple,
  progress: number,
): Vector3Tuple {
  return [
    from[0] + (to[0] - from[0]) * progress,
    from[1] + (to[1] - from[1]) * progress,
    from[2] + (to[2] - from[2]) * progress,
  ];
}

export function getSceneObjectsAtTime(
  objects: SceneObject[],
  keyframes: SceneKeyframe[],
  time: number,
) {
  return objects.map((object) => {
    const patch: Partial<SceneObject> = {};

    (["position", "rotation", "scale"] as KeyframeChannel[]).forEach(
      (channel) => {
        const frames = keyframes
          .filter(
            (frame) => frame.objectId === object.id && frame.channel === channel,
          )
          .sort((a, b) => a.time - b.time);

        if (frames.length === 0) {
          return;
        }

        const first = frames[0];
        const last = frames[frames.length - 1];

        if (time <= first.time) {
          patch[channel] = first.value;
          return;
        }

        if (time >= last.time) {
          patch[channel] = last.value;
          return;
        }

        const nextIndex = frames.findIndex((frame) => frame.time >= time);
        const prev = frames[nextIndex - 1];
        const next = frames[nextIndex];
        const span = Math.max(next.time - prev.time, 0.001);
        const rawProgress = clamp((time - prev.time) / span, 0, 1);
        const eased =
          next.easing === "power2.out"
            ? 1 - Math.pow(1 - rawProgress, 2)
            : rawProgress;

        patch[channel] = lerpTuple(prev.value, next.value, eased);
      },
    );

    return Object.keys(patch).length > 0 ? { ...object, ...patch } : object;
  });
}

export function createProjectSummary(
  project: SceneDocument,
  scope: ProjectSummary["scope"],
): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    objectCount: project.objects.length,
    uiBlockCount: project.uiBlocks.length,
    keyframeCount: project.keyframes.length,
    updatedAt: project.updatedAt,
    scope,
  };
}
