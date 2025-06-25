import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STORY_SEEDS = [
  "A magical forest adventure",
  "A lost robot in space",
  "The secret life of a city cat",
  "A fairy's quest to save the moon",
];

export default function HomeScreen() {
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleStartStory = () => {
    if (selectedSeed) {
      router.push({ pathname: "/Story", params: { seed: selectedSeed } });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView
        style={[styles.container, { paddingBottom: insets.bottom + 24 }]}
      >
        <ThemedText type="title" style={styles.header}>
          Welcome to Dream Fairy!
        </ThemedText>
        <ThemedText type="subtitle" style={styles.subtitle}>
          Choose a story seed to begin your adventure:
        </ThemedText>
        <FlatList
          data={STORY_SEEDS}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.seedCard,
                selectedSeed === item && styles.selectedSeedCard,
              ]}
              onPress={() => setSelectedSeed(item)}
            >
              <ThemedText type="defaultSemiBold" style={styles.seedCardText}>
                {item}
              </ThemedText>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.seedList}
        />
        <TouchableOpacity
          style={[styles.startButton, !selectedSeed && styles.disabledButton]}
          onPress={handleStartStory}
          disabled={!selectedSeed}
        >
          <ThemedText
            type="defaultSemiBold"
            style={[
              styles.startButtonText,
              !selectedSeed
                ? styles.startButtonTextDisabled
                : styles.startButtonTextEnabled,
            ]}
          >
            Start Story
          </ThemedText>
        </TouchableOpacity>
        {/* Placeholder for future: Your Stories */}
        {/* <ThemedText type="subtitle" style={{ marginTop: 32 }}>
          Your Stories (Coming Soon)
        </ThemedText> */}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
    paddingTop: Platform.OS === "web" ? 32 : 0,
  },
  container: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  header: {
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 32,
    marginBottom: 16,
    textAlign: "center",
  },
  seedList: {
    width: "100%",
    marginBottom: 24,
  },
  seedCard: {
    padding: 16,
    borderRadius: 0,
    backgroundColor: "#74B9FF",
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  selectedSeedCard: {
    backgroundColor: "#55EFC4",
    transform: [{ translateX: -2 }, { translateY: -2 }],
    shadowOffset: { width: 6, height: 6 },
  },
  startButton: {
    backgroundColor: "#FF6B6B",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 0,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 4,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  disabledButton: {
    backgroundColor: "#B2BEC3",
    shadowOffset: { width: 2, height: 2 },
  },
  seedCardText: {
    color: "#2D3436",
    fontFamily: "PressStart2P",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  startButtonText: {
    fontSize: 14,
    fontFamily: "PressStart2P",
  },
  startButtonTextEnabled: {
    color: "#F5F3F4",
  },
  startButtonTextDisabled: {
    color: "#636E72",
  },
});
