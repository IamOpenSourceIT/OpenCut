import type { TTimeCode } from "@/types/time";

export function formatTimeCode({
  timeInSeconds,
  format = "MM:SS",
}: {
  timeInSeconds: number;
  format?: TTimeCode;
}): string {
  const totalSeconds = Math.max(0, timeInSeconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const centiseconds = Math.floor((totalSeconds * 100) % 100);

  const pad = (n: number, d = 2) => n.toString().padStart(d, "0");

  switch (format) {
    case "HH:MM:SS":
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    case "HH:MM:SS:CS":
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(centiseconds)}`;
    case "MM:SS":
    default:
      return `${pad(minutes)}:${pad(seconds)}`;
  }
}

export function formatDuration(seconds: number): string {
  if (seconds >= 3600) {
    return formatTimeCode({ timeInSeconds: seconds, format: "HH:MM:SS" });
  }
  return formatTimeCode({ timeInSeconds: seconds, format: "MM:SS" });
}
