import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useEditor } from "@/hooks/use-editor";
import { useThemeColor } from "@/hooks/use-theme-color";
import { formatDuration } from "@/utils/time";
import type { TProjectMetadata } from "@/types/project";

export default function ProjectsScreen() {
  const editor = useEditor();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");

  const borderColor = useThemeColor({}, "icon");
  const tintColor = useThemeColor({}, "tint");
  const cardBg = useThemeColor(
    { light: "#f5f5f5", dark: "#1e2022" },
    "background"
  );
  const textMuted = useThemeColor(
    { light: "#687076", dark: "#9BA1A6" },
    "text"
  );

  useEffect(() => {
    if (!editor.project.getIsInitialized()) {
      editor.project.loadAllProjects();
    }
  }, [editor.project]);

  const projects = editor.project.getFilteredAndSortedProjects({
    searchQuery,
    sortOption: "updatedAt-desc",
  });
  const isLoading = editor.project.getIsLoading();

  const handleNewProject = () => {
    Alert.prompt(
      "New Project",
      "Enter a project name",
      async (name) => {
        if (!name?.trim()) return;
        const id = await editor.project.createNewProject({
          name: name.trim(),
        });
        router.push(`/editor/${id}`);
      },
      "plain-text",
      "Untitled project"
    );
  };

  const handleOpenProject = (id: string) => {
    router.push(`/editor/${id}`);
  };

  const handleDeleteProject = (project: TProjectMetadata) => {
    Alert.alert("Delete Project", `Delete "${project.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => editor.project.deleteProjects({ ids: [project.id] }),
      },
    ]);
  };

  const renderProject = ({ item }: { item: TProjectMetadata }) => {
    const date = item.updatedAt.toLocaleDateString();

    return (
      <Pressable
        style={[styles.projectCard, { backgroundColor: cardBg }]}
        onPress={() => handleOpenProject(item.id)}
        onLongPress={() => handleDeleteProject(item)}
      >
        <View
          style={[
            styles.projectThumbnail,
            { backgroundColor: borderColor + "22" },
          ]}
        >
          <ThemedText style={styles.projectThumbnailText}>
            {item.name.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <View style={styles.projectInfo}>
          <ThemedText style={styles.projectName} numberOfLines={1}>
            {item.name}
          </ThemedText>
          <ThemedText style={[styles.projectMeta, { color: textMuted }]}>
            {date}
            {item.duration > 0 ? ` · ${formatDuration(item.duration)}` : ""}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Projects
        </ThemedText>
        <Pressable
          style={[styles.newButton, { backgroundColor: tintColor }]}
          onPress={handleNewProject}
        >
          <ThemedText style={styles.newButtonText}>+ New</ThemedText>
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              borderColor: borderColor + "44",
              color: useThemeColor({}, "text"),
              backgroundColor: cardBg,
            },
          ]}
          placeholder="Search projects..."
          placeholderTextColor={textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isLoading ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={{ color: textMuted }}>Loading...</ThemedText>
        </View>
      ) : projects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText
            style={[styles.emptyTitle, { color: textMuted }]}
          >
            {searchQuery ? "No projects found" : "No projects yet"}
          </ThemedText>
          {!searchQuery && (
            <ThemedText style={[styles.emptySubtitle, { color: textMuted }]}>
              Tap "+ New" to create your first project
            </ThemedText>
          )}
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={renderProject}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
  },
  newButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  searchInput: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  projectCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  projectThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  projectThumbnailText: {
    fontSize: 22,
    fontWeight: "700",
  },
  projectInfo: {
    flex: 1,
    marginLeft: 12,
  },
  projectName: {
    fontSize: 16,
    fontWeight: "600",
  },
  projectMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
});
