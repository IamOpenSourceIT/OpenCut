import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useEditor } from "@/hooks/use-editor";
import { useThemeColor } from "@/hooks/use-theme-color";
import { formatDuration } from "@/utils/time";

const SCREEN_WIDTH = Dimensions.get("window").width;
const PIXELS_PER_SECOND = 60;
const TRACK_HEIGHT = 44;

export default function EditorScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const editor = useEditor();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);

  const bgColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint");
  const textMuted = useThemeColor(
    { light: "#687076", dark: "#9BA1A6" },
    "text"
  );
  const surfaceBg = useThemeColor(
    { light: "#f0f0f0", dark: "#1a1c1e" },
    "background"
  );
  const trackBg = useThemeColor(
    { light: "#e8e8e8", dark: "#252729" },
    "background"
  );
  const elementColor = useThemeColor(
    { light: "#0a7ea4", dark: "#38BDF8" },
    "tint"
  );

  useEffect(() => {
    if (!projectId) return;
    editor.project
      .loadProject({ id: projectId })
      .then(() => setLoading(false))
      .catch(() => {
        setLoading(false);
      });
  }, [projectId, editor.project]);

  const activeProject = editor.project.getActive();
  const tracks = editor.timeline.getTracks();
  const totalDuration = editor.timeline.getTotalDuration();
  const currentTime = editor.playback.getCurrentTime();
  const isPlaying = editor.playback.getIsPlaying();

  const handleSave = async () => {
    await editor.project.saveCurrentProject();
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={{ marginTop: 12, color: textMuted }}>
            Loading project...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!activeProject) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ThemedText>Project not found</ThemedText>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <ThemedText style={{ color: tintColor }}>Go back</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* ─── Header ──────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ThemedText style={[styles.backButton, { color: tintColor }]}>
            ← Back
          </ThemedText>
        </Pressable>
        <ThemedText style={styles.projectTitle} numberOfLines={1}>
          {activeProject.metadata.name}
        </ThemedText>
        <Pressable onPress={handleSave} hitSlop={12}>
          <ThemedText style={[styles.saveButton, { color: tintColor }]}>
            Save
          </ThemedText>
        </Pressable>
      </View>

      {/* ─── Preview panel ───────────────────────────────── */}
      <View style={[styles.previewContainer, { backgroundColor: surfaceBg }]}>
        <View
          style={[
            styles.previewCanvas,
            {
              backgroundColor: activeProject.settings.background.type === "color"
                ? activeProject.settings.background.color
                : "#000",
              aspectRatio:
                activeProject.settings.canvasSize.width /
                activeProject.settings.canvasSize.height,
            },
          ]}
        >
          {tracks.length === 0 && (
            <ThemedText style={styles.previewPlaceholder}>
              Add media to get started
            </ThemedText>
          )}
        </View>
      </View>

      {/* ─── Playback controls ───────────────────────────── */}
      <View style={styles.controls}>
        <ThemedText style={[styles.timeCode, { color: textMuted }]}>
          {formatDuration(currentTime)}
        </ThemedText>

        <View style={styles.controlButtons}>
          <Pressable
            onPress={() => editor.playback.seek({ time: 0 })}
            hitSlop={12}
            style={styles.controlBtn}
          >
            <ThemedText style={styles.controlIcon}>⏮</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => editor.playback.toggle()}
            hitSlop={12}
            style={[styles.playButton, { backgroundColor: tintColor }]}
          >
            <ThemedText style={styles.playIcon}>
              {isPlaying ? "⏸" : "▶"}
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() =>
              editor.playback.seek({
                time: Math.min(totalDuration, currentTime + 5),
              })
            }
            hitSlop={12}
            style={styles.controlBtn}
          >
            <ThemedText style={styles.controlIcon}>⏭</ThemedText>
          </Pressable>
        </View>

        <ThemedText style={[styles.timeCode, { color: textMuted }]}>
          {formatDuration(totalDuration)}
        </ThemedText>
      </View>

      {/* ─── Timeline ────────────────────────────────────── */}
      <View style={[styles.timelineContainer, { backgroundColor: surfaceBg }]}>
        <View style={styles.timelineHeader}>
          <ThemedText style={[styles.timelineLabel, { color: textMuted }]}>
            Timeline
          </ThemedText>
          <ThemedText style={[styles.trackCount, { color: textMuted }]}>
            {tracks.length} track{tracks.length !== 1 ? "s" : ""}
          </ThemedText>
        </View>

        {tracks.length === 0 ? (
          <View style={styles.emptyTimeline}>
            <ThemedText style={{ color: textMuted, fontSize: 14 }}>
              No tracks yet — import media to begin editing
            </ThemedText>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.timelineScroll}
          >
            <View
              style={{
                width: Math.max(
                  SCREEN_WIDTH - 16,
                  totalDuration * PIXELS_PER_SECOND + 100
                ),
              }}
            >
              {/* Ruler */}
              <View style={styles.ruler}>
                {Array.from(
                  { length: Math.ceil(totalDuration) + 1 },
                  (_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.rulerMark,
                        { left: i * PIXELS_PER_SECOND },
                      ]}
                    >
                      <ThemedText
                        style={[styles.rulerText, { color: textMuted }]}
                      >
                        {formatDuration(i)}
                      </ThemedText>
                    </View>
                  )
                )}
              </View>

              {/* Playhead */}
              <View
                style={[
                  styles.playhead,
                  {
                    left: currentTime * PIXELS_PER_SECOND,
                    backgroundColor: tintColor,
                  },
                ]}
              />

              {/* Tracks */}
              {tracks.map((track) => (
                <View
                  key={track.id}
                  style={[
                    styles.track,
                    { backgroundColor: trackBg, height: TRACK_HEIGHT },
                  ]}
                >
                  {track.elements.map((el) => (
                    <View
                      key={el.id}
                      style={[
                        styles.element,
                        {
                          left: el.startTime * PIXELS_PER_SECOND,
                          width: el.duration * PIXELS_PER_SECOND,
                          backgroundColor: elementColor + "cc",
                        },
                      ]}
                    >
                      <ThemedText
                        style={styles.elementLabel}
                        numberOfLines={1}
                      >
                        {el.name}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {/* ─── Bottom toolbar ──────────────────────────────── */}
      <View
        style={[
          styles.toolbar,
          { paddingBottom: insets.bottom + 8, backgroundColor: bgColor },
        ]}
      >
        <ToolbarButton
          label="Split"
          icon="✂"
          color={textMuted}
          onPress={() => {
            const selection = editor.selection.getSelection();
            if (selection.length > 0) {
              editor.timeline.splitElements({
                elements: selection,
                splitTime: currentTime,
              });
            }
          }}
        />
        <ToolbarButton
          label="Delete"
          icon="🗑"
          color={textMuted}
          onPress={() => {
            const selection = editor.selection.getSelection();
            if (selection.length > 0) {
              editor.timeline.deleteElements({ elements: selection });
              editor.selection.clearSelection();
            }
          }}
        />
        <ToolbarButton label="Text" icon="T" color={textMuted} onPress={() => {}} />
        <ToolbarButton label="Audio" icon="♪" color={textMuted} onPress={() => {}} />
        <ToolbarButton label="Media" icon="📷" color={textMuted} onPress={() => {}} />
      </View>
    </ThemedView>
  );
}

function ToolbarButton({
  label,
  icon,
  color,
  onPress,
}: {
  label: string;
  icon: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.toolbarBtn} onPress={onPress} hitSlop={8}>
      <ThemedText style={styles.toolbarIcon}>{icon}</ThemedText>
      <ThemedText style={[styles.toolbarLabel, { color }]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 48,
  },
  backButton: {
    fontSize: 16,
    fontWeight: "500",
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 12,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: "500",
  },
  previewContainer: {
    flex: 1,
    minHeight: 200,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  previewCanvas: {
    width: "80%",
    maxHeight: "90%",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  previewPlaceholder: {
    color: "#ffffff88",
    fontSize: 14,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  controlButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  controlBtn: {
    padding: 8,
  },
  controlIcon: {
    fontSize: 18,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: {
    fontSize: 18,
    color: "#fff",
  },
  timeCode: {
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    width: 50,
  },
  timelineContainer: {
    marginHorizontal: 8,
    borderRadius: 12,
    overflow: "hidden",
    minHeight: 120,
    maxHeight: 200,
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timelineLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  trackCount: {
    fontSize: 12,
  },
  emptyTimeline: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  timelineScroll: {
    flex: 1,
  },
  ruler: {
    height: 20,
    position: "relative",
  },
  rulerMark: {
    position: "absolute",
    top: 0,
  },
  rulerText: {
    fontSize: 10,
  },
  playhead: {
    position: "absolute",
    top: 0,
    width: 2,
    height: "100%",
    zIndex: 10,
  },
  track: {
    height: TRACK_HEIGHT,
    marginBottom: 2,
    borderRadius: 4,
    position: "relative",
    overflow: "hidden",
  },
  element: {
    position: "absolute",
    top: 2,
    bottom: 2,
    borderRadius: 4,
    paddingHorizontal: 6,
    justifyContent: "center",
  },
  elementLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "500",
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#88888833",
  },
  toolbarBtn: {
    alignItems: "center",
    gap: 2,
    paddingVertical: 4,
    minWidth: 52,
  },
  toolbarIcon: {
    fontSize: 20,
  },
  toolbarLabel: {
    fontSize: 11,
  },
});
