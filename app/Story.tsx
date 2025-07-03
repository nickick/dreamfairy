import { NarrationNavbar } from "@/components/NarrationNavbar";
import { StoryChoices } from "@/components/StoryChoices";
import { StoryNode } from "@/components/StoryNode";
import { LoadingStates } from "@/components/StoryNodeLoader";
import { StoryNodeLoaderWrapper } from "@/components/StoryNodeLoaderWrapper";
import { ThemedView } from "@/components/ThemedView";
import { VideoBackground } from "@/components/VideoBackground";
import { storyThemeMap } from "@/constants/Themes";
import { getVideoForTheme } from "@/constants/VideoBackgrounds";
import { useTranslation } from "@/constants/translations";
import { useTheme } from "@/contexts/ThemeContext";
import { StoryHistoryItem, useGenerateStory } from "@/hooks/useGenerateStory";
import { useStoryPersistence } from "@/hooks/useStoryPersistence";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, ScrollView, StyleSheet } from "react-native";

interface StoryStep {
  story: string;
  choice: string | null; // null for the first node
}

const CHOICES_PANE_HEIGHT = 300;
const CHOICES_PANE_HEIGHT_LOADING = 64;

export default function StoryScreen() {
  const { seed, storyId } = useLocalSearchParams();

  const [steps, setSteps] = useState<StoryStep[]>([]); // Each step: {story, choice}
  const [history, setHistory] = useState<StoryHistoryItem[]>([]); // Full story context for the hook
  const [currentNarrationIndex, setCurrentNarrationIndex] = useState<
    number | null
  >(null);
  const { t } = useTranslation();
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  const [nodeIds, setNodeIds] = useState<string[]>([]);
  const [skipInitialGeneration, setSkipInitialGeneration] = useState(!!storyId);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    text: false,
    image: false,
    narration: false,
    choices: false,
  });
  const [showLoader, setShowLoader] = useState(true);
  const [hasNarratedCurrent, setHasNarratedCurrent] = useState(false);
  const [autoPlayNodeIndex, setAutoPlayNodeIndex] = useState<number | null>(
    null
  );
  const narrationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const { story, choices, loading, error, regenerate } = useGenerateStory(
    typeof seed === "string" && !skipInitialGeneration ? seed : undefined,
    history
  );
  const scrollViewRef = useRef<ScrollView>(null);
  const [choicesPanelHeight] = useState(
    new Animated.Value(CHOICES_PANE_HEIGHT)
  );
  const prevLoading = useRef(false);
  const { theme, themeName, isDark, setThemeName } = useTheme();
  const colors = isDark ? theme.colors.dark : theme.colors.light;
  const latestY = useRef<number | null>(null);
  const {
    speak,
    pause,
    stop,
    isLoading: ttsLoading,
    isPlaying,
    progress,
    error: ttsError,
    getLastAudioUrl,
  } = useTextToSpeech();
  const { createStory, saveNode, updateNodeAssets, loadStoryData } =
    useStoryPersistence();
  const [loadedData, setLoadedData] = useState<any>(null);

  // Set theme based on story seed
  useEffect(() => {
    if (typeof seed === "string" && storyThemeMap[seed]) {
      setThemeName(storyThemeMap[seed]);
    }
  }, [seed, setThemeName]);

  // Log unmount and cleanup
  useEffect(() => {
    return () => {
      if (narrationTimeoutRef.current) {
        clearTimeout(narrationTimeoutRef.current);
      }
    };
  }, []);

  // Track if we've loaded an existing story
  const [isExistingStoryLoaded, setIsExistingStoryLoaded] = useState(false);
  const [existingNodeData, setExistingNodeData] = useState<Map<number, any>>(
    new Map()
  );
  const [pendingAssets, setPendingAssets] = useState<{
    imageUrl?: string;
    narrationUrl?: string;
    nodeIndex?: number;
  } | null>(null);
  const [loadedChoices, setLoadedChoices] = useState<string[] | null>(null);
  const generatingAssetsRef = useRef(false);
  const generatedStoriesRef = useRef<Set<string>>(new Set());

  // Load existing story if storyId is provided
  useEffect(() => {
    const loadStory = async () => {
      if (typeof storyId === "string" && !loadedData) {
        const data = await loadStoryData(storyId);
        if (data) {
          setLoadedData(data);
          setCurrentStoryId(data.storyId);
          setSteps(data.steps);
          setHistory(data.history);
          setNodeIds(data.nodeIds);
          setExistingNodeData(new Map(data.nodeDataMap));
          setLoadedChoices(data.choices);
          setIsExistingStoryLoaded(true);
          setPendingAssets(null); // Clear any pending assets when loading

          // If we're loading an existing story with no seed (from profile), keep generation disabled
          if (!seed) {
            setSkipInitialGeneration(true);
          }

          // Set the latest story node as the current narration
          if (data.steps.length > 0) {
            setCurrentNarrationIndex(data.steps.length - 1);

            // Scroll to the latest node after a brief delay to ensure layout is complete
            setTimeout(() => {
              if (scrollViewRef.current && latestY.current !== null) {
                scrollViewRef.current.scrollTo({
                  y: latestY.current - 24,
                  animated: true,
                });
              }
            }, 300);
          }
        }
      }
    };
    loadStory();
  }, [storyId, loadStoryData, seed]);

  // Update existingNodeData and database when pendingAssets change
  useEffect(() => {
    const updateAssetsForNode = async () => {
      if (
        pendingAssets &&
        pendingAssets.nodeIndex !== undefined &&
        steps.length > 0
      ) {
        const targetNodeIndex = pendingAssets.nodeIndex;

        // Only process if the node exists in steps
        if (targetNodeIndex < steps.length) {
          // Update local cache
          setExistingNodeData((prev) => {
            const newMap = new Map(prev);
            const currentData = newMap.get(targetNodeIndex) || {};
            newMap.set(targetNodeIndex, {
              ...currentData,
              imageUrl: pendingAssets.imageUrl || currentData.imageUrl,
              narrationUrl:
                pendingAssets.narrationUrl || currentData.narrationUrl,
            });
            return newMap;
          });

          // Update database if we have a node ID
          const nodeId = nodeIds[targetNodeIndex];
          if (nodeId) {
            const updates: any = {};
            if (pendingAssets.imageUrl)
              updates.image_url = pendingAssets.imageUrl;
            if (pendingAssets.narrationUrl)
              updates.narration_url = pendingAssets.narrationUrl;

            if (Object.keys(updates).length > 0) {
              await updateNodeAssets(nodeId, updates);

              // Clear pending assets after saving
              setPendingAssets(null);
            }
          }
        }
      }
    };

    updateAssetsForNode();
  }, [pendingAssets, steps.length, nodeIds, updateNodeAssets]);

  // Track when loading starts
  useEffect(() => {
    // Only show loader for new story generation, not when loading existing stories
    if (loading && !prevLoading.current && !isExistingStoryLoaded) {
      setShowLoader(true);
      setHasNarratedCurrent(false);
      // Don't clear pendingAssets here - they might be for the previous node
      setAutoPlayNodeIndex(null);
      setLoadingStates({
        text: false,
        image: false,
        narration: false,
        choices: false,
      });
    }
    prevLoading.current = loading;
  }, [loading, showLoader, isExistingStoryLoaded]);

  // Show loader immediately when starting with a seed
  useEffect(() => {
    if (
      typeof seed === "string" &&
      !skipInitialGeneration &&
      !isExistingStoryLoaded &&
      steps.length === 0
    ) {
      setShowLoader(true);
      setLoadingStates({
        text: false,
        image: false,
        narration: false,
        choices: false,
      });
    }
  }, [seed, skipInitialGeneration, isExistingStoryLoaded, steps.length]);

  // Track when story and choices are loaded and trigger edge functions
  useEffect(() => {
    // Only trigger for new story content when loader is showing
    if (story && choices && !error && !isExistingStoryLoaded && showLoader) {
      const latestNodeIndex = steps.length; // This will be the index of the new node

      // Check if we've already generated assets for this story content
      const storyKey = story.substring(0, 100); // Use first 100 chars as key
      if (generatedStoriesRef.current.has(storyKey)) {
        return;
      }
      // Mark text and choices as loaded immediately
      setLoadingStates((prev) => ({
        ...prev,
        text: true,
        choices: true,
      }));

      // Start generating image and narration in parallel
      const generateAssets = async () => {
        // Prevent concurrent generation
        if (generatingAssetsRef.current) {
          return;
        }
        generatingAssetsRef.current = true;
        generatedStoriesRef.current.add(storyKey);

        // Check current state of assets - note: latestNodeIndex is for the NEW node being added
        // So we shouldn't have existing data for it yet
        const currentNodeData = existingNodeData.get(latestNodeIndex);
        const hasExistingImage = !!currentNodeData?.imageUrl;
        const hasExistingNarration = !!currentNodeData?.narrationUrl;

        // Variables to collect generated assets
        let newImageUrl: string | undefined;
        let newNarrationUrl: string | undefined;

        // Start both generations in parallel
        const imagePromise = (async () => {
          if (!hasExistingImage) {
            try {
              const { EdgeFunctions } = await import("@/lib/edgeFunctions");
              const imageResponse = await EdgeFunctions.generateImage({
                prompt: story,
                width: 512,
                height: 512,
              });
              newImageUrl = imageResponse.imageUrl;
              // Store the image URL for later use
              setPendingAssets((prev) => ({
                ...prev,
                imageUrl: imageResponse.imageUrl,
                nodeIndex: latestNodeIndex,
              }));
              setPendingNode((prev) =>
                prev
                  ? { ...prev, imageUrl: newImageUrl }
                  : { story, choice: null, choices, imageUrl: newImageUrl }
              );
            } catch (err) {
              console.error("[Story] Image generation failed:", err);
            } finally {
              setLoadingStates((prev) => ({
                ...prev,
                image: true,
              }));
            }
          } else {
            setLoadingStates((prev) => ({
              ...prev,
              image: true,
            }));
          }
        })();

        const narrationPromise = (async () => {
          if (!hasExistingNarration) {
            try {
              const { EdgeFunctions } = await import("@/lib/edgeFunctions");
              const narrationResponse = await EdgeFunctions.textToSpeech({
                text: story,
                voiceType: "narrator",
              });
              newNarrationUrl = narrationResponse.audioUrl;
              // Store the narration URL for later use
              setPendingAssets((prev) => ({
                ...prev,
                narrationUrl: narrationResponse.audioUrl,
                nodeIndex: latestNodeIndex,
              }));
              setPendingNode((prev) =>
                prev
                  ? { ...prev, narrationUrl: newNarrationUrl }
                  : {
                      story,
                      choice: null,
                      choices,
                      narrationUrl: newNarrationUrl,
                    }
              );
            } catch (err) {
              console.error("[Story] Narration generation failed:", err);
            } finally {
              setLoadingStates((prev) => ({
                ...prev,
                narration: true,
              }));
            }
          } else {
            setLoadingStates((prev) => ({
              ...prev,
              narration: true,
            }));
          }
        })();

        // Wait for both to complete (but they run in parallel)
        await Promise.all([imagePromise, narrationPromise]);

        // Assets will be saved by the pendingAssets useEffect

        // Reset flag
        generatingAssetsRef.current = false;
      };

      generateAssets();
    }
  }, [story, choices, steps.length, error, isExistingStoryLoaded, showLoader]);

  // On first load, add the first story node and create story in database
  useEffect(() => {
    // Skip if we're loading an existing story or if we have a storyId
    if (isExistingStoryLoaded || storyId) {
      return;
    }

    if (story && steps.length === 0 && !loading && !error && !currentStoryId) {
      const initializeStory = async () => {
        // Create story in database
        if (typeof seed === "string") {
          const newStory = await createStory(seed);
          if (newStory) {
            setCurrentStoryId(newStory.id);

            // Save first node
            const node = await saveNode({
              currentStoryId: newStory.id,
              nodeIndex: 0,
              story,
              choiceMade: null,
              choices,
            });

            if (node) {
              setNodeIds([node.id]);
            }
          }
        }

        setSteps([{ story, choice: null }]);
        // Don't set history here - it should remain empty until user makes a choice
        // This prevents triggering another generation
        setCurrentNarrationIndex(0);
        setAutoPlayNodeIndex(0);
        // Keep loader visible until assets are generated
        setShowLoader(true);
      };

      initializeStory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story, loading, error, currentStoryId, isExistingStoryLoaded, storyId]);

  // When a new choice is made, add the new story node and save to database
  useEffect(() => {
    // Skip if this is just the existing story being loaded
    if (isExistingStoryLoaded && steps.length === history.length + 1) {
      setIsExistingStoryLoaded(false); // Reset flag after initial load
      return;
    }

    if (
      story &&
      steps.length > 0 &&
      steps[steps.length - 1].story !== story &&
      !loading &&
      !error &&
      currentStoryId &&
      history.length > 0 // Only create new nodes when user has made choices
    ) {
      const saveNewNode = async () => {
        const nodeIndex = steps.length;
        const choiceMade = history[history.length - 1]?.choiceMade;

        // Save the new node with assets if available
        const node = await saveNode({
          currentStoryId,
          nodeIndex,
          story,
          choiceMade,
          choices,
          imageUrl: pendingAssets?.imageUrl,
          narrationUrl: pendingAssets?.narrationUrl,
        });

        if (node) {
          setNodeIds((prev) => [...prev, node.id]);

          // If we have pending assets, save them to the database
          if (pendingAssets && Object.keys(pendingAssets).length > 0) {
            const updates: any = {};
            if (pendingAssets.imageUrl)
              updates.image_url = pendingAssets.imageUrl;
            if (pendingAssets.narrationUrl)
              updates.narration_url = pendingAssets.narrationUrl;

            if (Object.keys(updates).length > 0) {
              await updateNodeAssets(node.id, updates);

              // Update local cache
              setExistingNodeData((prev) => {
                const newMap = new Map(prev);
                newMap.set(nodeIndex, {
                  imageUrl: pendingAssets.imageUrl,
                  narrationUrl: pendingAssets.narrationUrl,
                });
                return newMap;
              });
            }

            // Clear pending assets
            setPendingAssets(null);
          }
        }

        setSteps((prev) => [...prev, { story, choice: choiceMade }]);
        setCurrentNarrationIndex(steps.length);
        setAutoPlayNodeIndex(steps.length);
      };

      saveNewNode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story, loading, error, currentStoryId]);

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

  // Hide loader when story is loaded or generated
  useEffect(() => {
    if (steps.length > 0 && !loading) {
      setShowLoader(false);
    }
  }, [steps.length, loading]);

  const [pendingNode, setPendingNode] = useState<{
    story: string;
    choice: string | null;
    choices: string[];
    imageUrl?: string;
    narrationUrl?: string;
  } | null>(null);

  const handleChoice = (choice: string) => {
    if (skipInitialGeneration) {
      setSkipInitialGeneration(false);
    }
    if (loadedChoices) {
      setLoadedChoices(null);
    }
    setHasNarratedCurrent(false);
    if (isPlaying) {
      stop();
    }
    if (narrationTimeoutRef.current) {
      clearTimeout(narrationTimeoutRef.current);
      narrationTimeoutRef.current = null;
    }
    if (isExistingStoryLoaded) {
      setIsExistingStoryLoaded(false);
    }
    setShowLoader(true);
    setLoadingStates({
      text: false,
      image: false,
      narration: false,
      choices: false,
    });

    // Set pendingNode immediately to trigger loader
    setPendingNode({
      story: "",
      choice,
      choices: [],
    });

    // Build the complete history including the current story and the choice being made
    const currentHistory: StoryHistoryItem[] = steps.map((step, index) => ({
      story: step.story,
      choiceMade: index < steps.length - 1 ? steps[index + 1].choice : choice,
    }));
    setHistory(currentHistory);
  };

  useEffect(() => {
    // Only trigger for new story content when loader is showing and the story is not already in steps
    if (
      story &&
      choices &&
      !error &&
      !isExistingStoryLoaded &&
      showLoader &&
      !steps.some((step) => step.story === story)
    ) {
      // Set pendingNode for the new story
      setPendingNode({
        story,
        choice: null, // or the current choice if available
        choices, // ensure this is the actual choices array from the hook
      });
      // Mark text and choices as loaded immediately
      setLoadingStates((prev) => ({
        ...prev,
        text: true,
        choices: true,
      }));
      // Start generating image and narration in parallel
      const generateAssets = async () => {
        if (generatingAssetsRef.current) return;
        generatingAssetsRef.current = true;
        let newImageUrl: string | undefined;
        let newNarrationUrl: string | undefined;
        try {
          const { EdgeFunctions } = await import("@/lib/edgeFunctions");
          const [imageResponse, narrationResponse] = await Promise.all([
            EdgeFunctions.generateImage({
              prompt: story,
              width: 512,
              height: 512,
            }),
            EdgeFunctions.textToSpeech({ text: story, voiceType: "narrator" }),
          ]);
          newImageUrl = imageResponse.imageUrl;
          newNarrationUrl = narrationResponse.audioUrl;
          setPendingNode((prev) =>
            prev
              ? {
                  ...prev,
                  imageUrl: newImageUrl,
                  narrationUrl: newNarrationUrl,
                }
              : {
                  story,
                  choice: null,
                  choices,
                  imageUrl: newImageUrl,
                  narrationUrl: newNarrationUrl,
                }
          );
        } catch (err) {
          console.error("[Story] Asset generation failed:", err);
        } finally {
          setLoadingStates({
            text: true,
            choices: true,
            image: true,
            narration: true,
          });
          generatingAssetsRef.current = false;
        }
      };
      generateAssets();
    }
  }, [story, choices, error, isExistingStoryLoaded, showLoader, steps]);

  // When all assets are ready, move pendingNode to steps and auto-play narration
  useEffect(() => {
    if (pendingNode && pendingNode.choices.length > 0) {
      setLoadedChoices(pendingNode.choices);
    }
  }, [pendingNode]);

  const handleNarrationPlay = async () => {
    if (currentNarrationIndex !== null && steps[currentNarrationIndex]) {
      const existingNarrationUrl = existingNodeData.get(
        currentNarrationIndex
      )?.narrationUrl;
      await speak(
        steps[currentNarrationIndex].story,
        "narrator",
        existingNarrationUrl
      );
      // If we generated a new narration, save it to the database
      if (!existingNarrationUrl) {
        const newAudioUrl = getLastAudioUrl();
        if (newAudioUrl && currentStoryId && nodeIds[currentNarrationIndex]) {
          await updateNodeAssets(nodeIds[currentNarrationIndex], {
            narration_url: newAudioUrl,
          });
          // Update local data
          const currentData = existingNodeData.get(currentNarrationIndex) || {};
          existingNodeData.set(currentNarrationIndex, {
            ...currentData,
            narrationUrl: newAudioUrl,
          });
        }
      }
    }
  };

  // Calculate navbar height: controls height + padding (5+5) + border
  const navbarHeight = 40 + 10 + theme.styles.borderWidth;

  // --- Refactor: Choices/gradient bar rendering logic ---
  const shouldShowChoices =
    !pendingNode &&
    steps.length > 0 &&
    ((loadedChoices && loadedChoices.length > 0) || loading || error);

  let latestNodeReady = false;
  if (shouldShowChoices) {
    const latestIdx = steps.length - 1;
    const nodeData = existingNodeData.get(latestIdx);
    const hasExistingAssets = !!(nodeData?.imageUrl && nodeData?.narrationUrl);
    const hasPendingAssets = !!(
      pendingAssets &&
      pendingAssets.nodeIndex === latestIdx &&
      pendingAssets.imageUrl &&
      pendingAssets.narrationUrl
    );
    latestNodeReady = hasExistingAssets || hasPendingAssets;
  }

  // On initial load with a seed, set pendingNode immediately
  useEffect(() => {
    if (
      typeof seed === "string" &&
      !skipInitialGeneration &&
      !isExistingStoryLoaded &&
      steps.length === 0 &&
      !pendingNode
    ) {
      setShowLoader(true);
      setLoadingStates({
        text: false,
        image: false,
        narration: false,
        choices: false,
      });
      setPendingNode({
        story: "",
        choice: null,
        choices: [],
      });
    }
  }, [
    seed,
    skipInitialGeneration,
    isExistingStoryLoaded,
    steps.length,
    pendingNode,
  ]);

  return (
    <ThemedView
      style={[styles.outerContainer, { backgroundColor: colors.background }]}
    >
      <VideoBackground
        videoSource={getVideoForTheme(themeName, "story")}
        isStoryPage={true}
      />
      <NarrationNavbar
        currentStoryText={
          currentNarrationIndex !== null && steps[currentNarrationIndex]
            ? steps[currentNarrationIndex].story
            : ""
        }
        ttsLoading={ttsLoading}
        isPlaying={isPlaying}
        progress={progress}
        ttsError={ttsError}
        onSpeak={handleNarrationPlay}
        onPause={pause}
        onStop={stop}
        showControls={steps.length > 0}
      />
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContainer,
          {
            paddingBottom: 48,
            paddingTop: navbarHeight,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Narrative nodes */}
        {steps.map((step, idx) => {
          const isLatestNode = idx === steps.length - 1;
          const nodeData = existingNodeData.get(idx);
          // Check if we have pending assets for this specific node
          const imageUrl = nodeData?.imageUrl;
          const narrationUrl = nodeData?.narrationUrl;

          if (!imageUrl || !narrationUrl) {
            return null;
          }

          return (
            <StoryNode
              key={idx}
              story={step.story}
              choice={step.choice}
              isDark={isDark}
              colors={colors}
              theme={theme}
              t={t}
              onLayout={
                isLatestNode
                  ? (e) => (latestY.current = e.nativeEvent.layout.y)
                  : undefined
              }
              isCurrentNarration={currentNarrationIndex === idx}
              onSelectNarration={async () => {
                setCurrentNarrationIndex(idx);
                const existingNarrationUrl =
                  existingNodeData.get(idx)?.narrationUrl;
                await speak(step.story, "narrator", existingNarrationUrl);

                // Save if new
                if (!existingNarrationUrl) {
                  const newAudioUrl = getLastAudioUrl();
                  if (newAudioUrl && currentStoryId && nodeIds[idx]) {
                    await updateNodeAssets(nodeIds[idx], {
                      narration_url: newAudioUrl,
                    });

                    // Update local data
                    const currentData = existingNodeData.get(idx) || {};
                    existingNodeData.set(idx, {
                      ...currentData,
                      narrationUrl: newAudioUrl,
                    });
                  }
                }
              }}
              nodeId={nodeIds[idx]}
              storyId={currentStoryId || undefined}
              existingImageUrl={imageUrl}
            />
          );
        })}
        {/* Strict atomic reveal: if pendingNode exists, always show only the loader after the last node */}
        {pendingNode ? (
          <StoryNodeLoaderWrapper
            showLoader={true}
            steps={steps}
            loadingStates={loadingStates}
            loading={loading}
            ttsLoading={ttsLoading}
            isPlaying={isPlaying}
            hasNarratedCurrent={hasNarratedCurrent}
            setShowLoader={setShowLoader}
            setCurrentNarrationIndex={setCurrentNarrationIndex}
            speak={speak}
            setHasNarratedCurrent={setHasNarratedCurrent}
            setAutoPlayNodeIndex={setAutoPlayNodeIndex}
            autoPlayNodeIndex={autoPlayNodeIndex}
            pendingAssets={pendingAssets}
            existingNodeData={existingNodeData}
            narrationTimeoutRef={narrationTimeoutRef}
            style={{ marginVertical: 24 }}
          />
        ) : (
          <StoryChoices
            choices={loadedChoices || []}
            loading={loading}
            error={error}
            onChoice={handleChoice}
            onRegenerate={regenerate}
            theme={theme}
            isDark={isDark}
            colors={colors}
            t={t}
            steps={steps}
          />
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
    paddingHorizontal: 5,
    paddingTop: 24,
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
  storyCardContainer: {
    width: "100%",
    overflow: "hidden",
  },
  storyText: {
    fontSize: 14,
    textAlign: "center",
    padding: 16,
    marginBottom: 0,
    marginTop: 0,
    lineHeight: 22,
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
    fontStyle: "normal",
    marginBottom: 8,
    textAlign: "center",
    fontSize: 10,
    opacity: 0.7,
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
    fontWeight: "normal",
    fontSize: 14,
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
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginVertical: 6,
    alignItems: "center",
    width: "98%",
    alignSelf: "center",
    elevation: 0,
  },
  choiceButtonDark: {
    backgroundColor: "#00B894",
    borderColor: "#F5F3F4",
  },
  choiceButtonText: {
    fontWeight: "normal",
    fontSize: 11,
    textAlign: "center",
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
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
    minWidth: 180,
  },
  regenButtonSmallDark: {
    backgroundColor: "#E84393",
    borderColor: "#F5F3F4",
  },
  regenButtonSmallText: {
    fontWeight: "normal",
    fontSize: 10,
  },
  regenButtonSmallTextDark: {
    color: "#fff",
  },
  gradientBarInline: {
    width: "100%",
    height: 56,
    paddingHorizontal: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  gradientBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 5,
    marginTop: 0,
    marginBottom: 5,
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
    marginBottom: 0,
    minHeight: 140,
  },
  storyImage: {
    width: "100%",
    height: 240,
    marginBottom: 0,
    backgroundColor: "#222",
  },
  imageErrorButton: {
    marginVertical: 8,
    padding: 10,
  },
  imageErrorText: {
    fontSize: 10,
    textAlign: "center",
  },
  selectNarrationButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: "center",
  },
  selectNarrationText: {
    fontSize: 12,
  },
  voiceSection: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  voiceSectionText: {
    fontSize: 12,
    marginBottom: 8,
    textAlign: "center",
  },
});
