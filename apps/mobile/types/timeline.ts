export interface TScene {
  id: string;
  name: string;
  isMain: boolean;
  tracks: TimelineTrack[];
  bookmarks: number[];
  createdAt: Date;
  updatedAt: Date;
}

export type TrackType = "video" | "text" | "audio" | "sticker";

interface BaseTrack {
  id: string;
  name: string;
}

export interface VideoTrack extends BaseTrack {
  type: "video";
  elements: (VideoElement | ImageElement)[];
  isMain: boolean;
  muted: boolean;
  hidden: boolean;
}

export interface TextTrack extends BaseTrack {
  type: "text";
  elements: TextElement[];
  hidden: boolean;
}

export interface AudioTrack extends BaseTrack {
  type: "audio";
  elements: AudioElement[];
  muted: boolean;
}

export interface StickerTrack extends BaseTrack {
  type: "sticker";
  elements: StickerElement[];
  hidden: boolean;
}

export type TimelineTrack = VideoTrack | TextTrack | AudioTrack | StickerTrack;

export interface Transform {
  scale: number;
  position: { x: number; y: number };
  rotate: number;
}

interface BaseTimelineElement {
  id: string;
  name: string;
  duration: number;
  startTime: number;
  trimStart: number;
  trimEnd: number;
}

interface BaseAudioElement extends BaseTimelineElement {
  type: "audio";
  volume: number;
  muted?: boolean;
}

export interface UploadAudioElement extends BaseAudioElement {
  sourceType: "upload";
  mediaId: string;
}

export interface LibraryAudioElement extends BaseAudioElement {
  sourceType: "library";
  sourceUrl: string;
}

export type AudioElement = UploadAudioElement | LibraryAudioElement;

export interface VideoElement extends BaseTimelineElement {
  type: "video";
  mediaId: string;
  muted?: boolean;
  hidden?: boolean;
  transform: Transform;
  opacity: number;
}

export interface ImageElement extends BaseTimelineElement {
  type: "image";
  mediaId: string;
  hidden?: boolean;
  transform: Transform;
  opacity: number;
}

export interface TextElement extends BaseTimelineElement {
  type: "text";
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  textAlign: "left" | "center" | "right";
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline" | "line-through";
  hidden?: boolean;
  transform: Transform;
  opacity: number;
}

export interface StickerElement extends BaseTimelineElement {
  type: "sticker";
  iconName: string;
  hidden?: boolean;
  transform: Transform;
  opacity: number;
  color?: string;
}

export type TimelineElement =
  | AudioElement
  | VideoElement
  | ImageElement
  | TextElement
  | StickerElement;

export type ElementType = TimelineElement["type"];

export type CreateTimelineElement = Omit<TimelineElement, "id">;

export interface ClipboardItem {
  trackId: string;
  trackType: TrackType;
  element: CreateTimelineElement;
}
