import type { TCanvasSize, TBackground } from "@/types/project";

export const DEFAULT_FPS = 30;

export const DEFAULT_CANVAS_SIZE: TCanvasSize = {
  width: 1080,
  height: 1920,
};

export const DEFAULT_COLOR = "#000000";

export const DEFAULT_BACKGROUND: TBackground = {
  type: "color",
  color: DEFAULT_COLOR,
};

export const CANVAS_PRESETS: TCanvasSize[] = [
  { width: 1080, height: 1920 }, // 9:16
  { width: 1920, height: 1080 }, // 16:9
  { width: 1080, height: 1080 }, // 1:1
  { width: 1080, height: 1350 }, // 4:5
  { width: 1280, height: 720 },  // 16:9 720p
];

export const CURRENT_PROJECT_VERSION = 1;
