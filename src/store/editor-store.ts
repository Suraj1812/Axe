"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  clamp,
  createDefaultScene,
  createSceneObject,
  createUiBlock,
  getSceneObjectsAtTime,
  makeId,
  type KeyframeChannel,
  type SceneDocument,
  type SceneKeyframe,
  type SceneObject,
  type SceneObjectType,
  type TransformMode,
  type UiBlock,
  type UiBlockType,
  type Vector3Tuple,
} from "@/lib/scene";

type SceneSnapshot = {
  objects: SceneObject[];
  keyframes: SceneKeyframe[];
  uiBlocks: UiBlock[];
};

type EditorStore = {
  projectId: string;
  projectName: string;
  selectedObjectId: string | null;
  selectedUiBlockId: string | null;
  transformMode: TransformMode;
  objects: SceneObject[];
  keyframes: SceneKeyframe[];
  uiBlocks: UiBlock[];
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  scrollAnimationEnabled: boolean;
  authToken: string | null;
  userEmail: string | null;
  past: SceneSnapshot[];
  future: SceneSnapshot[];
  addObject: (type: SceneObjectType, overrides?: Partial<SceneObject>) => string;
  updateObject: (
    id: string,
    patch: Partial<SceneObject>,
    recordHistory?: boolean,
  ) => void;
  deleteObject: (id: string) => void;
  selectObject: (id: string | null) => void;
  setTransformMode: (mode: TransformMode) => void;
  addKeyframe: (objectId: string, channel: KeyframeChannel) => void;
  updateKeyframe: (id: string, patch: Partial<SceneKeyframe>) => void;
  deleteKeyframe: (id: string) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setPlaying: (isPlaying: boolean) => void;
  setScrollAnimationEnabled: (enabled: boolean) => void;
  addUiBlock: (type: UiBlockType) => string;
  updateUiBlock: (id: string, patch: Partial<UiBlock>) => void;
  deleteUiBlock: (id: string) => void;
  selectUiBlock: (id: string | null) => void;
  hydrateScene: (scene: SceneDocument) => void;
  serializeScene: () => SceneDocument;
  setProjectMeta: (id: string, name: string) => void;
  setAuth: (token: string | null, email: string | null) => void;
  undo: () => void;
  redo: () => void;
};

const starter = createDefaultScene();

function snapshot(state: EditorStore): SceneSnapshot {
  return {
    objects: state.objects,
    keyframes: state.keyframes,
    uiBlocks: state.uiBlocks,
  };
}

function withHistory(state: EditorStore) {
  return {
    past: [...state.past.slice(-49), snapshot(state)],
    future: [],
  };
}

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      projectId: starter.id,
      projectName: starter.name,
      selectedObjectId: starter.objects[0]?.id ?? null,
      selectedUiBlockId: null,
      transformMode: "translate",
      objects: starter.objects,
      keyframes: starter.keyframes,
      uiBlocks: starter.uiBlocks,
      duration: starter.duration,
      currentTime: 0,
      isPlaying: false,
      scrollAnimationEnabled: true,
      authToken: null,
      userEmail: null,
      past: [],
      future: [],
      addObject: (type, overrides) => {
        const object = createSceneObject(type, overrides);
        set((state) => ({
          ...withHistory(state),
          objects: [...state.objects, object],
          selectedObjectId: object.id,
          selectedUiBlockId: null,
        }));
        return object.id;
      },
      updateObject: (id, patch, recordHistory = true) => {
        set((state) => ({
          ...(recordHistory ? withHistory(state) : {}),
          objects: state.objects.map((object) =>
            object.id === id ? { ...object, ...patch } : object,
          ),
        }));
      },
      deleteObject: (id) => {
        set((state) => ({
          ...withHistory(state),
          objects: state.objects.filter((object) => object.id !== id),
          keyframes: state.keyframes.filter((frame) => frame.objectId !== id),
          uiBlocks: state.uiBlocks.map((block) =>
            block.anchorObjectId === id ? { ...block, anchorObjectId: null } : block,
          ),
          selectedObjectId:
            state.selectedObjectId === id ? state.objects.find((o) => o.id !== id)?.id ?? null : state.selectedObjectId,
        }));
      },
      selectObject: (id) =>
        set({
          selectedObjectId: id,
          selectedUiBlockId: null,
        }),
      setTransformMode: (mode) => set({ transformMode: mode }),
      addKeyframe: (objectId, channel) => {
        const state = get();
        const animatedObjects = getSceneObjectsAtTime(
          state.objects,
          state.keyframes,
          state.currentTime,
        );
        const object = animatedObjects.find((item) => item.id === objectId);

        if (!object) {
          return;
        }

        const value = object[channel] as Vector3Tuple;
        const frame: SceneKeyframe = {
          id: makeId("kf"),
          objectId,
          channel,
          time: Number(state.currentTime.toFixed(2)),
          value,
          easing: "power2.out",
        };

        set((current) => ({
          ...withHistory(current),
          keyframes: [...current.keyframes, frame].sort((a, b) => a.time - b.time),
        }));
      },
      updateKeyframe: (id, patch) => {
        set((state) => ({
          ...withHistory(state),
          keyframes: state.keyframes.map((frame) =>
            frame.id === id ? { ...frame, ...patch } : frame,
          ),
        }));
      },
      deleteKeyframe: (id) => {
        set((state) => ({
          ...withHistory(state),
          keyframes: state.keyframes.filter((frame) => frame.id !== id),
        }));
      },
      setCurrentTime: (time) => {
        const state = get();
        const nextTime = clamp(time, 0, state.duration);
        set({ currentTime: nextTime });
      },
      setDuration: (duration) =>
        set({ duration: clamp(Number(duration.toFixed(2)), 1, 30) }),
      setPlaying: (isPlaying) => set({ isPlaying }),
      setScrollAnimationEnabled: (enabled) =>
        set({ scrollAnimationEnabled: enabled }),
      addUiBlock: (type) => {
        const block = createUiBlock(type);
        set((state) => ({
          ...withHistory(state),
          uiBlocks: [...state.uiBlocks, block],
          selectedUiBlockId: block.id,
          selectedObjectId: null,
        }));
        return block.id;
      },
      updateUiBlock: (id, patch) => {
        set((state) => ({
          ...withHistory(state),
          uiBlocks: state.uiBlocks.map((block) =>
            block.id === id ? { ...block, ...patch } : block,
          ),
        }));
      },
      deleteUiBlock: (id) => {
        set((state) => ({
          ...withHistory(state),
          uiBlocks: state.uiBlocks.filter((block) => block.id !== id),
          selectedUiBlockId:
            state.selectedUiBlockId === id ? null : state.selectedUiBlockId,
        }));
      },
      selectUiBlock: (id) =>
        set({
          selectedUiBlockId: id,
          selectedObjectId: null,
        }),
      hydrateScene: (scene) =>
        set({
          projectId: scene.id,
          projectName: scene.name,
          objects: scene.objects,
          keyframes: scene.keyframes,
          uiBlocks: scene.uiBlocks,
          duration: scene.duration,
          currentTime: 0,
          selectedObjectId: scene.objects[0]?.id ?? null,
          selectedUiBlockId: null,
          past: [],
          future: [],
        }),
      serializeScene: () => {
        const state = get();

        return {
          id: state.projectId,
          name: state.projectName,
          objects: state.objects,
          keyframes: state.keyframes,
          uiBlocks: state.uiBlocks,
          duration: state.duration,
          updatedAt: new Date().toISOString(),
        };
      },
      setProjectMeta: (id, name) => set({ projectId: id, projectName: name }),
      setAuth: (token, email) => set({ authToken: token, userEmail: email }),
      undo: () => {
        const state = get();
        const previous = state.past.at(-1);

        if (!previous) {
          return;
        }

        set({
          ...previous,
          past: state.past.slice(0, -1),
          future: [snapshot(state), ...state.future].slice(0, 50),
        });
      },
      redo: () => {
        const state = get();
        const next = state.future[0];

        if (!next) {
          return;
        }

        set({
          ...next,
          past: [...state.past, snapshot(state)].slice(-50),
          future: state.future.slice(1),
        });
      },
    }),
    {
      name: "axe-editor-state",
      partialize: (state) => ({
        projectId: state.projectId,
        projectName: state.projectName,
        selectedObjectId: state.selectedObjectId,
        selectedUiBlockId: state.selectedUiBlockId,
        transformMode: state.transformMode,
        objects: state.objects,
        keyframes: state.keyframes,
        uiBlocks: state.uiBlocks,
        duration: state.duration,
        currentTime: state.currentTime,
        scrollAnimationEnabled: state.scrollAnimationEnabled,
        authToken: state.authToken,
        userEmail: state.userEmail,
      }),
    },
  ),
);
