import type { TScene, TimelineTrack, TimelineElement } from "@/types/timeline";
import type {
  TProject,
  TProjectMetadata,
  TProjectSettings,
} from "@/types/project";
import type { MediaAsset } from "@/types/assets";
import { generateUUID } from "@/utils/id";
import { storageService } from "@/services/storage";
import {
  DEFAULT_FPS,
  DEFAULT_CANVAS_SIZE,
  DEFAULT_COLOR,
  CURRENT_PROJECT_VERSION,
} from "@/constants/project";

type Listener = () => void;

function buildDefaultScene({
  name,
  isMain,
}: {
  name: string;
  isMain: boolean;
}): TScene {
  return {
    id: generateUUID(),
    name,
    isMain,
    tracks: [
      {
        id: generateUUID(),
        name: "Video 1",
        type: "video",
        elements: [],
        isMain: true,
        muted: false,
        hidden: false,
      },
    ],
    bookmarks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function getProjectDurationFromScenes({
  scenes,
}: {
  scenes: TScene[];
}): number {
  let maxDuration = 0;
  for (const scene of scenes) {
    for (const track of scene.tracks) {
      for (const element of track.elements) {
        const endTime = element.startTime + element.duration;
        if (endTime > maxDuration) {
          maxDuration = endTime;
        }
      }
    }
  }
  return maxDuration;
}

// ─── Playback Manager ──────────────────────────────────────────────

class PlaybackManager {
  private currentTime = 0;
  private playing = false;
  private animationFrame: ReturnType<typeof requestAnimationFrame> | null =
    null;
  private lastTimestamp = 0;
  private listeners = new Set<Listener>();

  getIsPlaying(): boolean {
    return this.playing;
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  toggle(): void {
    if (this.playing) {
      this.pause();
    } else {
      this.play();
    }
  }

  play(): void {
    if (this.playing) return;
    this.playing = true;
    this.lastTimestamp = performance.now();
    this.tick();
    this.notify();
  }

  pause(): void {
    if (!this.playing) return;
    this.playing = false;
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.notify();
  }

  seek({ time }: { time: number }): void {
    this.currentTime = Math.max(0, time);
    this.notify();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private tick = (): void => {
    if (!this.playing) return;
    const now = performance.now();
    const delta = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;
    this.currentTime += delta;
    this.notify();
    this.animationFrame = requestAnimationFrame(this.tick);
  };

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

// ─── Timeline Manager ──────────────────────────────────────────────

class TimelineManager {
  private core: EditorCore;

  constructor(core: EditorCore) {
    this.core = core;
  }

  getTracks(): TimelineTrack[] {
    const scene = this.core.scenes.getActiveScene();
    return scene?.tracks ?? [];
  }

  getTotalDuration(): number {
    const tracks = this.getTracks();
    let max = 0;
    for (const track of tracks) {
      for (const el of track.elements) {
        const end = el.startTime + el.duration;
        if (end > max) max = end;
      }
    }
    return max;
  }

  addTrack({ type, index }: { type: string; index?: number }): string {
    const scene = this.core.scenes.getActiveScene();
    if (!scene) return "";

    const track: TimelineTrack = {
      id: generateUUID(),
      name: `${type} ${scene.tracks.length + 1}`,
      type: type as TimelineTrack["type"],
      elements: [],
      ...(type === "video" ? { isMain: false, muted: false, hidden: false } : {}),
      ...(type === "audio" ? { muted: false } : {}),
      ...(type === "text" || type === "sticker" ? { hidden: false } : {}),
    } as TimelineTrack;

    if (index !== undefined) {
      scene.tracks.splice(index, 0, track);
    } else {
      scene.tracks.push(track);
    }

    this.core.notify();
    return track.id;
  }

  insertElement({
    element,
    placement,
  }: {
    element: Omit<TimelineElement, "id"> & { id?: string };
    placement: { mode: "auto" } | { mode: "explicit"; trackId: string };
  }): void {
    const scene = this.core.scenes.getActiveScene();
    if (!scene) return;

    const elementWithId = { ...element, id: element.id ?? generateUUID() } as TimelineElement;

    if (placement.mode === "explicit") {
      const track = scene.tracks.find((t) => t.id === placement.trackId);
      if (track) {
        (track.elements as TimelineElement[]).push(elementWithId);
      }
    } else {
      const matchingTrack = scene.tracks.find((t) => {
        if (elementWithId.type === "video" || elementWithId.type === "image")
          return t.type === "video";
        if (elementWithId.type === "audio") return t.type === "audio";
        if (elementWithId.type === "text") return t.type === "text";
        if (elementWithId.type === "sticker") return t.type === "sticker";
        return false;
      });

      if (matchingTrack) {
        (matchingTrack.elements as TimelineElement[]).push(elementWithId);
      } else {
        const trackType =
          elementWithId.type === "video" || elementWithId.type === "image"
            ? "video"
            : elementWithId.type;
        const newTrackId = this.addTrack({ type: trackType });
        const newTrack = scene.tracks.find((t) => t.id === newTrackId);
        if (newTrack) {
          (newTrack.elements as TimelineElement[]).push(elementWithId);
        }
      }
    }

    this.core.notify();
  }

  deleteElements({
    elements,
  }: {
    elements: Array<{ trackId: string; elementId: string }>;
  }): void {
    const scene = this.core.scenes.getActiveScene();
    if (!scene) return;

    for (const { trackId, elementId } of elements) {
      const track = scene.tracks.find((t) => t.id === trackId);
      if (!track) continue;
      (track as { elements: TimelineElement[] }).elements = (
        track.elements as TimelineElement[]
      ).filter((el) => el.id !== elementId);
    }
    this.core.notify();
  }

  splitElements({
    elements,
    splitTime,
    retainSide,
  }: {
    elements: Array<{ trackId: string; elementId: string }>;
    splitTime: number;
    retainSide?: "left" | "right";
  }): void {
    const scene = this.core.scenes.getActiveScene();
    if (!scene) return;

    for (const { trackId, elementId } of elements) {
      const track = scene.tracks.find((t) => t.id === trackId);
      if (!track) continue;

      const elIndex = (track.elements as TimelineElement[]).findIndex(
        (e) => e.id === elementId
      );
      if (elIndex === -1) continue;

      const el = (track.elements as TimelineElement[])[elIndex];
      const endTime = el.startTime + el.duration;
      if (splitTime <= el.startTime || splitTime >= endTime) continue;

      const leftDuration = splitTime - el.startTime;
      const rightDuration = endTime - splitTime;

      if (retainSide === "left") {
        (track.elements as TimelineElement[])[elIndex] = {
          ...el,
          duration: leftDuration,
        };
      } else if (retainSide === "right") {
        (track.elements as TimelineElement[])[elIndex] = {
          ...el,
          startTime: splitTime,
          duration: rightDuration,
          trimStart: el.trimStart + leftDuration,
        };
      } else {
        const leftEl = { ...el, duration: leftDuration };
        const rightEl = {
          ...el,
          id: generateUUID(),
          startTime: splitTime,
          duration: rightDuration,
          trimStart: el.trimStart + leftDuration,
        };
        (track.elements as TimelineElement[]).splice(elIndex, 1, leftEl, rightEl);
      }
    }
    this.core.notify();
  }

  subscribe(listener: Listener): () => void {
    return this.core.subscribe(listener);
  }
}

// ─── Scenes Manager ────────────────────────────────────────────────

class ScenesManager {
  private scenes: TScene[] = [];
  private currentSceneId = "";
  private core: EditorCore;

  constructor(core: EditorCore) {
    this.core = core;
  }

  initializeScenes({
    scenes,
    currentSceneId,
  }: {
    scenes: TScene[];
    currentSceneId: string;
  }): void {
    this.scenes = scenes;
    this.currentSceneId = currentSceneId || scenes[0]?.id || "";
    this.core.notify();
  }

  getScenes(): TScene[] {
    return this.scenes;
  }

  getActiveScene(): TScene | null {
    return this.scenes.find((s) => s.id === this.currentSceneId) ?? null;
  }

  setActiveScene({ id }: { id: string }): void {
    this.currentSceneId = id;
    this.core.notify();
  }

  clearScenes(): void {
    this.scenes = [];
    this.currentSceneId = "";
    this.core.notify();
  }

  toggleBookmark({ time }: { time: number }): void {
    const scene = this.getActiveScene();
    if (!scene) return;
    const idx = scene.bookmarks.indexOf(time);
    if (idx >= 0) {
      scene.bookmarks.splice(idx, 1);
    } else {
      scene.bookmarks.push(time);
      scene.bookmarks.sort((a, b) => a - b);
    }
    this.core.notify();
  }

  isBookmarked({ time }: { time: number }): boolean {
    const scene = this.getActiveScene();
    return scene?.bookmarks.includes(time) ?? false;
  }

  subscribe(listener: Listener): () => void {
    return this.core.subscribe(listener);
  }
}

// ─── Media Manager ─────────────────────────────────────────────────

class MediaManager {
  private assets: MediaAsset[] = [];
  private core: EditorCore;

  constructor(core: EditorCore) {
    this.core = core;
  }

  getAssets(): MediaAsset[] {
    return this.assets;
  }

  addAsset({ asset }: { asset: MediaAsset }): void {
    this.assets.push(asset);
    this.core.notify();
  }

  removeAsset({ id }: { id: string }): void {
    this.assets = this.assets.filter((a) => a.id !== id);
    this.core.notify();
  }

  clearAllAssets(): void {
    this.assets = [];
    this.core.notify();
  }

  subscribe(listener: Listener): () => void {
    return this.core.subscribe(listener);
  }
}

// ─── Project Manager ───────────────────────────────────────────────

class ProjectManager {
  private active: TProject | null = null;
  private savedProjects: TProjectMetadata[] = [];
  private isLoading = true;
  private isInitialized = false;
  private core: EditorCore;
  private listeners = new Set<Listener>();

  constructor(core: EditorCore) {
    this.core = core;
  }

  getActive(): TProject | null {
    return this.active;
  }

  getIsLoading(): boolean {
    return this.isLoading;
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  getSavedProjects(): TProjectMetadata[] {
    return this.savedProjects;
  }

  getFilteredAndSortedProjects({
    searchQuery,
    sortOption,
  }: {
    searchQuery: string;
    sortOption: string;
  }): TProjectMetadata[] {
    let projects = [...this.savedProjects];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      projects = projects.filter((p) => p.name.toLowerCase().includes(q));
    }

    const [sortKey, sortOrder] = sortOption.split("-");
    projects.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "duration":
          cmp = a.duration - b.duration;
          break;
        case "createdAt":
          cmp = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case "updatedAt":
        default:
          cmp = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return projects;
  }

  async createNewProject({ name }: { name: string }): Promise<string> {
    const mainScene = buildDefaultScene({ name: "Main scene", isMain: true });
    const newProject: TProject = {
      metadata: {
        id: generateUUID(),
        name,
        duration: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      scenes: [mainScene],
      currentSceneId: mainScene.id,
      settings: {
        fps: DEFAULT_FPS,
        canvasSize: DEFAULT_CANVAS_SIZE,
        originalCanvasSize: null,
        background: { type: "color", color: DEFAULT_COLOR },
      },
      version: CURRENT_PROJECT_VERSION,
    };

    this.active = newProject;
    this.core.media.clearAllAssets();
    this.core.scenes.initializeScenes({
      scenes: newProject.scenes,
      currentSceneId: newProject.currentSceneId,
    });

    await storageService.saveProject({ project: newProject });
    this.updateMetadata(newProject);

    return newProject.metadata.id;
  }

  async loadProject({ id }: { id: string }): Promise<void> {
    this.isLoading = true;
    this.notify();

    this.core.media.clearAllAssets();
    this.core.scenes.clearScenes();

    const project = await storageService.loadProject({ id });
    if (!project) {
      this.isLoading = false;
      this.notify();
      throw new Error(`Project ${id} not found`);
    }

    this.active = project;

    if (project.scenes.length > 0) {
      this.core.scenes.initializeScenes({
        scenes: project.scenes,
        currentSceneId: project.currentSceneId,
      });
    }

    this.isLoading = false;
    this.notify();
  }

  async saveCurrentProject(): Promise<void> {
    if (!this.active) return;

    const scenes = this.core.scenes.getScenes();
    const updatedProject: TProject = {
      ...this.active,
      scenes,
      metadata: {
        ...this.active.metadata,
        duration: getProjectDurationFromScenes({ scenes }),
        updatedAt: new Date(),
      },
    };

    await storageService.saveProject({ project: updatedProject });
    this.active = updatedProject;
    this.updateMetadata(updatedProject);
  }

  async loadAllProjects(): Promise<void> {
    this.isLoading = true;
    this.notify();

    const metadata = await storageService.loadAllProjectsMetadata();
    this.savedProjects = metadata;
    this.isLoading = false;
    this.isInitialized = true;
    this.notify();
  }

  async deleteProjects({ ids }: { ids: string[] }): Promise<void> {
    for (const id of ids) {
      await storageService.deleteProject({ id });
    }

    const idSet = new Set(ids);
    this.savedProjects = this.savedProjects.filter((p) => !idSet.has(p.id));

    if (this.active && idSet.has(this.active.metadata.id)) {
      this.active = null;
      this.core.media.clearAllAssets();
      this.core.scenes.clearScenes();
    }

    this.notify();
  }

  async renameProject({
    id,
    name,
  }: {
    id: string;
    name: string;
  }): Promise<void> {
    const project = await storageService.loadProject({ id });
    if (!project) return;

    const updated: TProject = {
      ...project,
      metadata: { ...project.metadata, name, updatedAt: new Date() },
    };

    await storageService.saveProject({ project: updated });

    if (this.active?.metadata.id === id) {
      this.active = updated;
    }

    this.updateMetadata(updated);
  }

  closeProject(): void {
    this.active = null;
    this.core.media.clearAllAssets();
    this.core.scenes.clearScenes();
    this.notify();
  }

  private updateMetadata(project: TProject): void {
    const idx = this.savedProjects.findIndex(
      (p) => p.id === project.metadata.id
    );
    if (idx >= 0) {
      this.savedProjects[idx] = project.metadata;
    } else {
      this.savedProjects.unshift(project.metadata);
    }
    this.notify();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
    this.core.notify();
  }
}

// ─── Selection Manager ─────────────────────────────────────────────

class SelectionManager {
  private selected: Array<{ trackId: string; elementId: string }> = [];
  private core: EditorCore;

  constructor(core: EditorCore) {
    this.core = core;
  }

  getSelection(): Array<{ trackId: string; elementId: string }> {
    return this.selected;
  }

  setSelection({
    elements,
  }: {
    elements: Array<{ trackId: string; elementId: string }>;
  }): void {
    this.selected = elements;
    this.core.notify();
  }

  clearSelection(): void {
    this.selected = [];
    this.core.notify();
  }

  subscribe(listener: Listener): () => void {
    return this.core.subscribe(listener);
  }
}

// ─── EditorCore ────────────────────────────────────────────────────

export class EditorCore {
  private static instance: EditorCore | null = null;
  private listeners = new Set<Listener>();

  public readonly playback: PlaybackManager;
  public readonly timeline: TimelineManager;
  public readonly scenes: ScenesManager;
  public readonly project: ProjectManager;
  public readonly media: MediaManager;
  public readonly selection: SelectionManager;

  private constructor() {
    this.playback = new PlaybackManager();
    this.timeline = new TimelineManager(this);
    this.scenes = new ScenesManager(this);
    this.project = new ProjectManager(this);
    this.media = new MediaManager(this);
    this.selection = new SelectionManager(this);
  }

  static getInstance(): EditorCore {
    if (!EditorCore.instance) {
      EditorCore.instance = new EditorCore();
    }
    return EditorCore.instance;
  }

  static reset(): void {
    EditorCore.instance = null;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
