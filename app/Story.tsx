import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useGenerateImage } from "@/hooks/useGenerateImage";
import { useGenerateStory } from "@/hooks/useGenerateStory";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  LayoutChangeEvent,
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

const StoryNode = React.forwardRef<
  View,
  {
    story: string;
    choice: string | null;
    isDark: boolean;
    onLayout?: (e: LayoutChangeEvent) => void;
  }
>(({ story, choice, isDark, onLayout }, _ref) => {
  const {
    imageUrl,
    loading: imageLoading,
    error: imageError,
    regenerate: regenerateImage,
  } = useGenerateImage(story);

  useEffect(() => {
    if (story) {
      regenerateImage();
    }
  }, [story, regenerateImage]);

  return (
    <View style={styles.storyBlock} onLayout={onLayout}>
      {choice && (
        <ThemedText
          style={[styles.choiceLabel, isDark && styles.choiceLabelDark]}
        >
          You chose: {choice}
        </ThemedText>
      )}
      {/* Image above the story text */}
      <View style={styles.imageContainer}>
        {imageLoading && (
          <ActivityIndicator
            size="large"
            color={isDark ? "#fff" : "#1D3D47"}
            style={{ marginVertical: 16 }}
          />
        )}
        {imageUrl && (
          <Animated.Image
            source={{ uri: imageUrl }}
            style={styles.storyImage}
            resizeMode="cover"
          />
        )}
        {imageError && (
          <TouchableOpacity
            onPress={regenerateImage}
            style={styles.imageErrorButton}
          >
            <ThemedText style={styles.imageErrorText}>
              Image failed to load. Tap to retry.
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
      <ThemedText
        style={[
          styles.storyText,
          isDark ? styles.storyTextDark : styles.storyTextLight,
        ]}
      >
        {story}
      </ThemedText>
    </View>
  );
});

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
  const latestY = useRef<number | null>(null);

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

  useEffect(() => {
    if (latestY.current !== null && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: latestY.current - 24,
        animated: true,
      });
    }
  }, [latestY]);

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
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: 48 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Narrative nodes */}
        {steps.map((step, idx) => (
          <StoryNode
            key={idx}
            story={step.story}
            choice={step.choice}
            isDark={isDark}
            onLayout={
              idx === steps.length - 1
                ? (e) => (latestY.current = e.nativeEvent.layout.y)
                : undefined
            }
          />
        ))}
        {/* Choices and divider below the latest narrative node */}
        {((choices && choices.length > 0) || loading) && (
          <>
            {/* Only show spinner when loading, otherwise show divider, choices, and regenerate button */}
            {loading ? (
              <ActivityIndicator
                size="large"
                color={isDark ? "#fff" : "#1D3D47"}
                style={{ marginVertical: 24 }}
              />
            ) : (
              <>
                {/* Gradient divider */}
                <LinearGradient
                  colors={
                    isDark ? ["#E84393", "#6C5CE7", "#0984E3"] : ["#FD79A8", "#A29BFE", "#74B9FF"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientBarInline}
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
                {/* Choices */}
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
                {/* Divider with 'or' and regenerate button */}
                <View style={styles.orDividerContainerInline}>
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
          </>
        )}
      </ScrollView>
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
    fontSize: 14,
    textAlign: "center",
    borderRadius: 0,
    padding: 16,
    marginBottom: 0,
    fontFamily: "PressStart2P",
    lineHeight: 22,
    borderWidth: 4,
    borderColor: "#000",
  },
  storyTextLight: {
    backgroundColor: "#FFE66D",
    color: "#2D3436",
    borderColor: "#2D3436",
  },
  storyTextDark: {
    backgroundColor: "#6C5CE7",
    color: "#F5F3F4",
    borderColor: "#F5F3F4",
  },
  choiceLabel: {
    color: "#888",
    fontStyle: "normal",
    marginBottom: 8,
    textAlign: "center",
    fontFamily: "PressStart2P",
    fontSize: 10,
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
    fontWeight: "normal",
    fontSize: 14,
    textAlign: "center",
    letterSpacing: 0.2,
    fontFamily: "PressStart2P",
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
    backgroundColor: "#55EFC4",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 0,
    marginVertical: 6,
    alignItems: "center",
    width: "98%",
    alignSelf: "center",
    borderWidth: 4,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  choiceButtonDark: {
    backgroundColor: "#00B894",
    borderColor: "#F5F3F4",
  },
  choiceButtonText: {
    color: "#2D3436",
    fontWeight: "normal",
    fontSize: 11,
    textAlign: "center",
    fontFamily: "PressStart2P",
    lineHeight: 16,
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
    fontStyle: "normal",
    color: "#888",
    zIndex: 2,
    alignSelf: "center",
    paddingHorizontal: 10,
    position: "absolute",
    left: "50%",
    transform: [{ translateX: -20 }],
    top: "50%",
    marginTop: -13,
    fontFamily: "PressStart2P",
    fontSize: 10,
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
    marginTop: 12,
    marginBottom: 0,
    zIndex: 1,
    position: "relative",
  },
  regenButtonSmall: {
    backgroundColor: "#FD79A8",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 0,
    alignItems: "center",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
    minWidth: 180,
    borderWidth: 4,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  regenButtonSmallDark: {
    backgroundColor: "#E84393",
    borderColor: "#F5F3F4",
  },
  regenButtonSmallText: {
    color: "#2D3436",
    fontWeight: "normal",
    fontSize: 10,
    fontFamily: "PressStart2P",
  },
  regenButtonSmallTextDark: {
    color: "#fff",
  },
  gradientBarInline: {
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 20,
    borderWidth: 4,
    borderColor: "#000",
  },
  orDividerContainerInline: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
    width: "100%",
    position: "relative",
    height: 24,
  },
  imageContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
    minHeight: 140,
  },
  storyImage: {
    width: "100%",
    height: 200,
    borderRadius: 0,
    marginBottom: 8,
    backgroundColor: "#222",
    borderWidth: 4,
    borderColor: "#000",
  },
  imageErrorButton: {
    marginVertical: 8,
    padding: 10,
    backgroundColor: "#E17055",
    borderRadius: 0,
    borderWidth: 4,
    borderColor: "#000",
  },
  imageErrorText: {
    color: "#fff",
    fontSize: 10,
    textAlign: "center",
    fontFamily: "PressStart2P",
  },
});
