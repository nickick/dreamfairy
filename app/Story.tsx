import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useGenerateStory } from "@/hooks/useGenerateStory";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

interface StoryStep {
  story: string;
  choice: string | null; // null for the first node
}

const CHOICES_PANE_HEIGHT = 300;
const CHOICES_PANE_HEIGHT_LOADING = 64;
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
  const [choicesPanelHeight] = useState(
    new Animated.Value(CHOICES_PANE_HEIGHT)
  );
  const prevLoading = useRef(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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

  useEffect(() => {
    const toValue = loading ? CHOICES_PANE_HEIGHT_LOADING : CHOICES_PANE_HEIGHT;
    Animated.timing(choicesPanelHeight, {
      toValue,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    prevLoading.current = loading;
  }, [loading, choicesPanelHeight]);

  const handleChoice = (choice: string) => {
    setHistory((prev) => [...prev, choice]);
  };

  return (
    <ThemedView
      style={[styles.outerContainer, isDark && styles.outerContainerDark]}
    >
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
              <ThemedText
                style={[styles.choiceLabel, isDark && styles.choiceLabelDark]}
              >
                You chose: {step.choice}
              </ThemedText>
            )}
            <ThemedText
              style={[
                styles.storyText,
                isDark ? styles.storyTextDark : styles.storyTextLight,
              ]}
            >
              {step.story}
            </ThemedText>
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
      {(choices && choices.length > 0) || loading ? (
        <View style={[styles.bottomBar, isDark && styles.bottomBarDark]}>
          <LinearGradient
            colors={isDark ? ["#a259ff", "#ff8859"] : ["#a259ff", "#ff8859"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBar}
          >
            <ThemedText
              style={[
                styles.gradientBarText,
                isDark && styles.gradientBarTextDark,
              ]}
            >
              What will you do next?
            </ThemedText>
          </LinearGradient>
          <Animated.View
            style={[
              styles.choicesPane,
              { height: choicesPanelHeight },
              isDark && styles.choicesPaneDark,
            ]}
          >
            <ScrollView
              contentContainerStyle={styles.choicesPaneContent}
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <ActivityIndicator
                  size="large"
                  color={isDark ? "#fff" : "#1D3D47"}
                  style={{ marginVertical: 16 }}
                />
              ) : (
                <>
                  {choices.map((choice, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.choiceButton,
                        isDark && styles.choiceButtonDark,
                      ]}
                      onPress={() => handleChoice(choice)}
                    >
                      <ThemedText
                        style={[
                          styles.choiceButtonText,
                          isDark && styles.choiceButtonTextDark,
                        ]}
                      >
                        {choice}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                  {/* Divider with 'or' */}
                  <View style={styles.orDividerContainer}>
                    <ThemedText
                      style={[
                        styles.orText,
                        isDark ? styles.orTextDark : styles.orTextLight,
                      ]}
                    >
                      <>{"or"}</>
                    </ThemedText>
                    <View style={styles.dividerLine} />
                  </View>
                  {/* Regenerate Story Button */}
                  <TouchableOpacity
                    onPress={regenerate}
                    style={[
                      styles.regenButtonSmall,
                      isDark && styles.regenButtonSmallDark,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.regenButtonSmallText,
                        isDark && styles.regenButtonSmallTextDark,
                      ]}
                    >
                      Regenerate Story
                    </ThemedText>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  outerContainerDark: {
    backgroundColor: "#000",
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 0,
  },
  storyTextLight: {
    backgroundColor: "#f7f7fa",
    color: "#111",
  },
  storyTextDark: {
    backgroundColor: "#232323",
    color: "#fff",
  },
  choiceLabel: {
    color: "#888",
    fontStyle: "italic",
    marginBottom: 6,
    textAlign: "center",
  },
  choiceLabelDark: {
    color: "#bbb",
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
  bottomBarDark: {
    backgroundColor: "#000",
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
  gradientBarTextDark: {
    color: "#111", // keep black for contrast on gradient
  },
  choicesPane: {
    width: "100%",
    maxHeight: CHOICES_PANE_HEIGHT,
    marginBottom: 0,
    paddingBottom: 0,
    overflow: "hidden",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  choicesPaneDark: {
    backgroundColor: "#000",
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
    width: "90%",
    alignSelf: "center",
  },
  choiceButtonDark: {
    backgroundColor: "#232323",
  },
  choiceButtonText: {
    color: "#1D3D47",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  choiceButtonTextDark: {
    color: "#fff",
  },
  orDividerContainer: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
    width: "100%",
  },
  orText: {
    fontStyle: "italic",
    color: "#888",
    zIndex: 2,
    alignSelf: "center",
    paddingHorizontal: 8,
    position: "absolute",
    left: "50%",
    transform: [{ translateX: -18 }], // half of typical text width
    top: "50%",
    marginTop: -12, // was -10, now -12 to move up 2px
  },
  orTextLight: {
    backgroundColor: "#fff",
  },
  orTextDark: {
    backgroundColor: "#000",
  },
  dividerLine: {
    height: 1,
    backgroundColor: "#ccc",
    width: "80%",
    alignSelf: "center",
    marginTop: 0,
    marginBottom: 0,
    zIndex: 1,
    position: "relative",
  },
  regenButtonSmall: {
    backgroundColor: "#a1cedc",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 16,
    alignItems: "center",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
    minWidth: 160,
  },
  regenButtonSmallDark: {
    backgroundColor: "#333e4a",
  },
  regenButtonSmallText: {
    color: "#1D3D47",
    fontWeight: "bold",
    fontSize: 15,
  },
  regenButtonSmallTextDark: {
    color: "#fff",
  },
});
