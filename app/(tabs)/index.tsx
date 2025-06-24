import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
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

  const handleStartStory = () => {
    if (selectedSeed) {
      // TODO: Implement story creation logic
      alert(`Starting story: ${selectedSeed}`);
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
              <ThemedText type="defaultSemiBold">{item}</ThemedText>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.seedList}
        />
        <TouchableOpacity
          style={[styles.startButton, !selectedSeed && styles.disabledButton]}
          onPress={handleStartStory}
          disabled={!selectedSeed}
        >
          <ThemedText type="defaultSemiBold" style={styles.startButtonText}>
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
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
    marginBottom: 12,
    alignItems: "center",
  },
  selectedSeedCard: {
    backgroundColor: "#a1cedc",
  },
  startButton: {
    backgroundColor: "#1D3D47",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
  },
});
