import { ThemedText } from "@/components/ThemedText";
import { useGenerateStory } from "@/hooks/useGenerateStory";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

export default function StoryScreen() {
  const { seed } = useLocalSearchParams();
  const [history, setHistory] = useState<string[]>([]);
  const { story, choices, loading, error, regenerate } = useGenerateStory(
    typeof seed === "string" ? seed : undefined,
    history
  );

  const handleChoice = (choice: string) => {
    setHistory((prev) => [...prev, choice]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title" style={styles.header}>
        Your Story Begins!
      </ThemedText>
      <ThemedText type="subtitle" style={styles.subtitle}>
        Seed: {seed}
      </ThemedText>
      {loading && (
        <ActivityIndicator
          size="large"
          color="#1D3D47"
          style={{ marginVertical: 32 }}
        />
      )}
      {error && (
        <>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity onPress={regenerate} style={styles.retryButton}>
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </TouchableOpacity>
        </>
      )}
      {story && !loading && !error && (
        <ThemedText style={styles.storyText}>{story}</ThemedText>
      )}
      {/* Show choices if available and not loading/error */}
      {!loading && !error && choices && choices.length > 0 && (
        <>
          <ThemedText type="subtitle" style={styles.choicesHeader}>
            What will you do next?
          </ThemedText>
          {choices.map((choice, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.choiceButton}
              onPress={() => handleChoice(choice)}
            >
              <ThemedText style={styles.choiceButtonText}>{choice}</ThemedText>
            </TouchableOpacity>
          ))}
        </>
      )}
      <TouchableOpacity onPress={regenerate} style={styles.regenButton}>
        <ThemedText style={styles.regenButtonText}>Regenerate Story</ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  header: {
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    marginBottom: 24,
    textAlign: "center",
  },
  storyText: {
    fontSize: 18,
    marginVertical: 24,
    textAlign: "center",
  },
  errorText: {
    color: "#c00",
    marginVertical: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#1D3D47",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  regenButton: {
    backgroundColor: "#a1cedc",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 24,
    alignItems: "center",
  },
  regenButtonText: {
    color: "#1D3D47",
    fontWeight: "bold",
  },
  choicesHeader: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  choiceButton: {
    backgroundColor: "#e0e0e0",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginVertical: 6,
    alignItems: "center",
    width: 280,
  },
  choiceButtonText: {
    color: "#1D3D47",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
});
