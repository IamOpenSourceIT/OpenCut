import { useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import { EditorCore } from "@/core/editor";

export function useEditor(): EditorCore {
  const editor = useMemo(() => EditorCore.getInstance(), []);
  const versionRef = useRef(0);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const handleChange = () => {
        versionRef.current += 1;
        onStoreChange();
      };

      const unsubscribers = [
        editor.playback.subscribe(handleChange),
        editor.project.subscribe(handleChange),
        editor.media.subscribe(handleChange),
        editor.subscribe(handleChange),
      ];

      return () => {
        for (const unsub of unsubscribers) {
          unsub();
        }
      };
    },
    [editor]
  );

  const getSnapshot = useCallback(() => versionRef.current, []);

  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return editor;
}
