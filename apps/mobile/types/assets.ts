export type MediaType = "image" | "video" | "audio";

export interface MediaAsset {
  id: string;
  name: string;
  type: MediaType;
  uri: string;
  width?: number;
  height?: number;
  duration?: number;
  thumbnailUri?: string;
  fileSize?: number;
}
