import { z } from "zod";

const vector3Schema = z.tuple([
  z.number().finite(),
  z.number().finite(),
  z.number().finite(),
]);

const materialSchema = z.object({
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  metalness: z.number().finite().min(0).max(1),
  roughness: z.number().finite().min(0).max(1),
  opacity: z.number().finite().min(0.02).max(1),
  wireframe: z.boolean(),
});

const sceneObjectSchema = z.object({
  id: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(160),
  type: z.enum(["box", "sphere", "plane", "model"]),
  position: vector3Schema,
  rotation: vector3Schema,
  scale: vector3Schema,
  material: materialSchema,
  modelUrl: z.string().max(12_000_000).nullable().optional(),
  visible: z.boolean(),
  locked: z.boolean(),
});

const keyframeSchema = z.object({
  id: z.string().trim().min(1).max(120),
  objectId: z.string().trim().min(1).max(120),
  channel: z.enum(["position", "rotation", "scale"]),
  time: z.number().finite().min(0).max(30),
  value: vector3Schema,
  easing: z.enum(["linear", "power2.out"]),
});

const uiBlockSchema = z.object({
  id: z.string().trim().min(1).max(120),
  type: z.enum(["text", "button"]),
  label: z.string().trim().min(1).max(240),
  anchorObjectId: z.string().trim().min(1).max(120).nullable(),
  position: z.object({
    x: z.number().finite().min(0).max(100),
    y: z.number().finite().min(0).max(100),
  }),
  size: z.object({
    width: z.number().finite().min(20).max(1200),
    height: z.number().finite().min(20).max(800),
  }),
  style: z.object({
    color: z.string().max(80),
    background: z.string().max(160),
    fontSize: z.number().finite().min(8).max(96),
    radius: z.number().finite().min(0).max(64),
  }),
});

export const sceneDocumentSchema = z.object({
  id: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(180),
  objects: z.array(sceneObjectSchema).max(500),
  keyframes: z.array(keyframeSchema).max(5000),
  uiBlocks: z.array(uiBlockSchema).max(500),
  duration: z.number().finite().min(1).max(30),
  updatedAt: z.string().default(() => new Date().toISOString()),
});

export function parseSceneDocument(input: unknown) {
  return sceneDocumentSchema.parse(input);
}

export function safeParseSceneDocument(input: unknown) {
  return sceneDocumentSchema.safeParse(input);
}
