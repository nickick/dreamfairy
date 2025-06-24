import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useGenerateStory } from "@/hooks/useGenerateStory";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface StoryStep {
  story: string;
  choice: string | null; // null for the first node
}

const CHOICES_PANE_HEIGHT = 220;
const REGEN_BAR_HEIGHT = 64;

export default function StoryScreen() {
  const { seed } = useLocalSearchParams();
  const [steps, setSteps] = useState<StoryStep[]>([]); // Each step: {story, choice}
  const [history, setHistory] = useState<string[]>([]); // Just the choices for the hook
  const { story, choices, loading, error, regenerate } = useGenerateStory(
    typeof seed === "string" ? seed : undefined,
    history
  );
  const scrollViewRef = useRef<ScrollView>(null);

  // On first load, add the first story node
  useEffect(() => {
    if (story && steps.length === 0 && !loading && !error) {
      setSteps([{ story, choice: null }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story, loading, error]);

  // When a new choice is made, add the new story node
  useEffect(() => {
    if (
      story &&
      steps.length > 0 &&
      steps[steps.length - 1].story !== story &&
      !loading &&
      !error
    ) {
      setSteps((prev) => [
        ...prev,
        { story, choice: history[history.length - 1] },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story, loading, error]);

  // Auto-scroll to bottom when steps change
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [steps.length]);

  const handleChoice = (choice: string) => {
    setHistory((prev) => [...prev, choice]);
  };

  return (
    <ThemedView style={styles.outerContainer}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: CHOICES_PANE_HEIGHT + REGEN_BAR_HEIGHT + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="title" style={styles.header}>
          Your Story Begins!
        </ThemedText>
        <ThemedText type="subtitle" style={styles.subtitle}>
          Seed: {seed}
        </ThemedText>
        {steps.map((step, idx) => (
          <View key={idx} style={styles.storyBlock}>
            {step.choice && (
              <ThemedText style={styles.choiceLabel}>
                You chose: {step.choice}
              </ThemedText>
            )}
            <ThemedText style={styles.storyText}>{step.story}</ThemedText>
          </View>
        ))}
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
      </ScrollView>
      {/* Bottom Bar: Gradient Title + Choices + Regenerate Button */}
      {!loading && !error && choices && choices.length > 0 && (
        <View style={styles.bottomBar}>
          <LinearGradient
            colors={["#a259ff", "#ff8859"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBar}
          >
            <ThemedText style={styles.gradientBarText}>
              What will you do next?
            </ThemedText>
          </LinearGradient>
          <ScrollView
            style={styles.choicesPane}
            contentContainerStyle={styles.choicesPaneContent}
            showsVerticalScrollIndicator={false}
          >
            {choices.map((choice, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.choiceButton}
                onPress={() => handleChoice(choice)}
              >
                <ThemedText style={styles.choiceButtonText}>
                  {choice}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity onPress={regenerate} style={styles.regenButton}>
            <ThemedText style={styles.regenButtonText}>
              Regenerate Story
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 120,
    alignItems: "center",
  },
  header: {
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    marginBottom: 24,
    textAlign: "center",
  },
  storyBlock: {
    marginBottom: 24,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  storyText: {
    fontSize: 18,
    textAlign: "center",
    backgroundColor: "#f7f7fa",
    borderRadius: 12,
    padding: 16,
  },
  choiceLabel: {
    color: "#888",
    fontStyle: "italic",
    marginBottom: 6,
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
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 0,
    paddingBottom: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  gradientBar: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  gradientBarText: {
    color: "#111",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  choicesPane: {
    width: "100%",
    maxHeight: CHOICES_PANE_HEIGHT - 16,
    marginBottom: 0,
    paddingBottom: 0,
  },
  choicesPaneContent: {
    alignItems: "center",
    paddingBottom: 0,
    paddingTop: 8,
  },
  choiceButton: {
    backgroundColor: "#e0e0e0",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginVertical: 4,
    alignItems: "center",
    width: 260,
  },
  choiceButtonText: {
    color: "#1D3D47",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  regenButton: {
    backgroundColor: "#a1cedc",
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 20,
    alignItems: "center",
    alignSelf: "center",
    marginTop: 8,
  },
  regenButtonText: {
    color: "#1D3D47",
    fontWeight: "bold",
  },
});
