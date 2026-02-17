import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";

const LINKS = [
  { label: "Website", url: "https://opencut.app" },
  { label: "GitHub", url: "https://github.com/OpenCut-app/OpenCut" },
  { label: "Roadmap", url: "https://opencut.app/roadmap" },
  { label: "Privacy policy", url: "https://opencut.app/privacy" },
  { label: "Terms of service", url: "https://opencut.app/terms" },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const cardBg = useThemeColor(
    { light: "#f5f5f5", dark: "#1e2022" },
    "background"
  );
  const textMuted = useThemeColor(
    { light: "#687076", dark: "#9BA1A6" },
    "text"
  );
  const tintColor = useThemeColor({}, "tint");

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Settings
        </ThemedText>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: textMuted }]}>
            About
          </ThemedText>
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.row}>
              <ThemedText style={styles.rowLabel}>App</ThemedText>
              <ThemedText style={[styles.rowValue, { color: textMuted }]}>
                OpenCut
              </ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <ThemedText style={styles.rowLabel}>Version</ThemedText>
              <ThemedText style={[styles.rowValue, { color: textMuted }]}>
                1.0.0
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: textMuted }]}>
            Links
          </ThemedText>
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            {LINKS.map((link, index) => (
              <View key={link.url}>
                {index > 0 && <View style={styles.divider} />}
                <Pressable
                  style={styles.row}
                  onPress={() => Linking.openURL(link.url)}
                >
                  <ThemedText style={styles.rowLabel}>{link.label}</ThemedText>
                  <ThemedText style={{ color: tintColor, fontSize: 16 }}>
                    →
                  </ThemedText>
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText
            style={[styles.footerText, { color: textMuted }]}
          >
            OpenCut is free, open-source, and privacy-first.{"\n"}
            Your videos never leave your device.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 12,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: {
    fontSize: 16,
  },
  rowValue: {
    fontSize: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#88888833",
    marginLeft: 16,
  },
  footerText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },
});
