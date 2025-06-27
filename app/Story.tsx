import { NarrationNavbar } from "@/components/NarrationNavbar";
import { LoadingStates, StoryNodeLoader } from "@/components/StoryNodeLoader";
import { StoryNode } from "@/components/StoryNode";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { storyThemeMap } from "@/constants/Themes";
import { useTranslation } from "@/constants/translations";
import { useTheme } from "@/contexts/ThemeContext";
import { useGenerateStory } from "@/hooks/useGenerateStory";
import { useStoryPersistence } from "@/hooks/useStoryPersistence";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface StoryStep {
  story: string;
  choice: string | null; // null for the first node
}

const CHOICES_PANE_HEIGHT = 300;
const CHOICES_PANE_HEIGHT_LOADING = 64;


export default function StoryScreen() {
  const { seed, storyId } = useLocalSearchParams();
  console.log("[Story] Component render - seed:", seed, "storyId:", storyId);

  const [steps, setSteps] = useState<StoryStep[]>([]); // Each step: {story, choice}
  const [history, setHistory] = useState<string[]>([]); // Just the choices for the hook
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
  const [showLoader, setShowLoader] = useState(false);
  const [hasNarratedCurrent, setHasNarratedCurrent] = useState(false);
  const narrationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { story, choices, loading, error, regenerate } = useGenerateStory(
    typeof seed === "string" && !skipInitialGeneration ? seed : undefined,
    history
  );
  const scrollViewRef = useRef<ScrollView>(null);
  const [choicesPanelHeight] = useState(
    new Animated.Value(CHOICES_PANE_HEIGHT)
  );
  const prevLoading = useRef(false);
  const { theme, isDark, setThemeName } = useTheme();
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
  const {
    createStory,
    saveNode,
    updateNodeAssets,
    loadStoryData,
  } = useStoryPersistence();
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
      console.log("[Story] Component unmounting!");
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
  } | null>(null);
  const [loadedChoices, setLoadedChoices] = useState<string[] | null>(null);
  const generatingAssetsRef = useRef(false);
  const generatedNodeIndicesRef = useRef<Set<number>>(new Set());

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
          
          console.log("[Story] Loaded node data map:", data.nodeDataMap);
          // Log each entry in the map
          data.nodeDataMap.forEach((value, key) => {
            console.log(`[Story] Node ${key} data:`, value);
          });
          
          // Test accessing the map
          console.log("[Story] Test accessing node 0:", data.nodeDataMap.get(0));
          console.log("[Story] Test accessing node 1:", data.nodeDataMap.get(1));

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
      if (pendingAssets && steps.length > 0) {
        const latestNodeIndex = steps.length - 1;
        console.log("[Story] Updating assets for index", latestNodeIndex, "with pendingAssets:", pendingAssets);
        
        // Update local cache
        setExistingNodeData((prev) => {
          const newMap = new Map(prev);
          const currentData = newMap.get(latestNodeIndex) || {};
          newMap.set(latestNodeIndex, {
            ...currentData,
            imageUrl: pendingAssets.imageUrl || currentData.imageUrl,
            narrationUrl: pendingAssets.narrationUrl || currentData.narrationUrl,
          });
          return newMap;
        });
        
        // Update database if we have a node ID
        const nodeId = nodeIds[latestNodeIndex];
        if (nodeId) {
          const updates: any = {};
          if (pendingAssets.imageUrl) updates.image_url = pendingAssets.imageUrl;
          if (pendingAssets.narrationUrl) updates.narration_url = pendingAssets.narrationUrl;
          
          if (Object.keys(updates).length > 0) {
            console.log("[Story] Saving pending assets to database for node", latestNodeIndex, "nodeId:", nodeId, "updates:", updates);
            await updateNodeAssets(nodeId, updates);
            
            // Clear pending assets after saving
            setPendingAssets(null);
          }
        } else {
          console.log("[Story] Warning: No nodeId available yet for index", latestNodeIndex, "will retry when nodeId is available");
        }
      }
    };
    
    updateAssetsForNode();
  }, [pendingAssets, steps.length, nodeIds, updateNodeAssets]);

  // Track when loading starts
  useEffect(() => {
    console.log(
      "[Story] Loading state changed:",
      loading,
      "Previous:",
      prevLoading.current,
      "showLoader:",
      showLoader,
      "isExistingStoryLoaded:",
      isExistingStoryLoaded
    );
    // Only show loader for new story generation, not when loading existing stories
    if (loading && !prevLoading.current && !isExistingStoryLoaded) {
      console.log("[Story] Starting loader");
      setShowLoader(true);
      setHasNarratedCurrent(false);
      setPendingAssets(null);
      // Clear generated indices for new story generation
      generatedNodeIndicesRef.current.clear();
      setLoadingStates({
        text: false,
        image: false,
        narration: false,
        choices: false,
      });
    } else if (!loading && prevLoading.current) {
      console.log("[Story] Loading finished");
    }
    prevLoading.current = loading;
  }, [loading, showLoader, isExistingStoryLoaded]);

  // Track when story and choices are loaded and trigger edge functions
  useEffect(() => {
    console.log("[Story] Story/choices update:", {
      story: !!story,
      choices: !!choices,
      error,
      isExistingStoryLoaded,
      showLoader,
      stepsLength: steps.length,
    });
    // Only trigger for new story content when loader is showing
    if (story && choices && !error && !isExistingStoryLoaded && showLoader) {
      const latestNodeIndex = steps.length;
      
      // Check if we've already generated assets for this node
      if (generatedNodeIndicesRef.current.has(latestNodeIndex)) {
        console.log("[Story] Assets already generated for nodeIndex:", latestNodeIndex);
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
        console.log("[Story] generateAssets called for nodeIndex:", latestNodeIndex);
        
        // Prevent concurrent generation
        if (generatingAssetsRef.current) {
          console.log("[Story] Asset generation already in progress");
          return;
        }
        generatingAssetsRef.current = true;
        generatedNodeIndicesRef.current.add(latestNodeIndex);
        
        // Check current state of assets
        const currentNodeData = existingNodeData.get(latestNodeIndex);
        const hasExistingImage = !!currentNodeData?.imageUrl;
        const hasExistingNarration = !!currentNodeData?.narrationUrl;
        
        console.log("[Story] Current node data:", { 
          latestNodeIndex, 
          hasExistingImage, 
          hasExistingNarration,
          currentNodeData 
        });
        
        // Variables to collect generated assets
        let newImageUrl: string | undefined;
        let newNarrationUrl: string | undefined;
        
        // Start both generations in parallel
        const imagePromise = (async () => {
          if (!hasExistingImage) {
            console.log("[Story] Starting image generation for nodeIndex:", latestNodeIndex);
            try {
              const { EdgeFunctions } = await import("@/lib/edgeFunctions");
              const imageResponse = await EdgeFunctions.generateImage({
                prompt: story,
                width: 512,
                height: 512,
              });
              console.log("[Story] Image generation complete");
              newImageUrl = imageResponse.imageUrl;
              // Store the image URL for later use
              setPendingAssets((prev) => ({
                ...prev,
                imageUrl: imageResponse.imageUrl,
              }));
              
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
            console.log("[Story] Starting narration generation for nodeIndex:", latestNodeIndex);
            try {
              const { EdgeFunctions } = await import("@/lib/edgeFunctions");
              const narrationResponse = await EdgeFunctions.textToSpeech({
                text: story,
                voiceType: "narrator",
              });
              console.log("[Story] Narration generation complete");
              newNarrationUrl = narrationResponse.audioUrl;
              // Store the narration URL for later use
              setPendingAssets((prev) => ({
                ...prev,
                narrationUrl: narrationResponse.audioUrl,
              }));
              
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
        console.log("[Story] Asset generation complete for node", latestNodeIndex);
        
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
        setCurrentNarrationIndex(0);
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
        const choiceMade = history[history.length - 1];

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

  const handleChoice = (choice: string) => {
    // When user makes a choice, allow generation
    if (skipInitialGeneration) {
      setSkipInitialGeneration(false);
    }
    // Clear loaded choices since user is making a new choice
    if (loadedChoices) {
      setLoadedChoices(null);
    }
    setHistory((prev) => [...prev, choice]);
  };

  const handleNarrationPlay = async () => {
    if (currentNarrationIndex !== null && steps[currentNarrationIndex]) {
      // Check if we have an existing narration URL for this node
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
    } else if (steps.length > 0) {
      // If no current narration, play the latest story
      const latestIndex = steps.length - 1;
      const existingNarrationUrl =
        existingNodeData.get(latestIndex)?.narrationUrl;
      await speak(steps[latestIndex].story, "narrator", existingNarrationUrl);
      setCurrentNarrationIndex(latestIndex);

      // Save if new
      if (!existingNarrationUrl) {
        const newAudioUrl = getLastAudioUrl();
        if (newAudioUrl && currentStoryId && nodeIds[latestIndex]) {
          await updateNodeAssets(nodeIds[latestIndex], {
            narration_url: newAudioUrl,
          });

          // Update local data
          const currentData = existingNodeData.get(latestIndex) || {};
          existingNodeData.set(latestIndex, {
            ...currentData,
            narrationUrl: newAudioUrl,
          });
        }
      }
    }
  };

  // Calculate navbar height: controls height + padding (5+5) + border
  const navbarHeight = 40 + 10 + theme.styles.borderWidth;

  return (
    <ThemedView
      style={[styles.outerContainer, { backgroundColor: colors.background }]}
    >
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
          // Don't render any story nodes, just show them all
          const isLatestNode = idx === steps.length - 1;
          const nodeData = existingNodeData.get(idx);
          const imageUrl = idx === steps.length - 1 && pendingAssets?.imageUrl
            ? pendingAssets.imageUrl
            : nodeData?.imageUrl;
          
          console.log(`[Story] Rendering node ${idx}, imageUrl:`, imageUrl, "nodeData:", nodeData, "existingNodeData size:", existingNodeData.size, "pendingAssets:", pendingAssets, "isExistingStoryLoaded:", isExistingStoryLoaded);

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
        {/* Show loader for new story node being generated */}
        {showLoader && (
          <StoryNodeLoader
            states={loadingStates}
            onComplete={() => {
              console.log("[Story] Loader complete, hiding loader");
              // Clear any existing timeout
              if (narrationTimeoutRef.current) {
                clearTimeout(narrationTimeoutRef.current);
              }
              // Defer state update to avoid React warning
              narrationTimeoutRef.current = setTimeout(() => {
                setShowLoader(false);
                // Auto-play narration after loader fades
                if (
                  !ttsLoading &&
                  !isPlaying &&
                  steps.length > 0 &&
                  currentNarrationIndex !== null &&
                  !hasNarratedCurrent
                ) {
                  const narrationUrl =
                    pendingAssets?.narrationUrl ||
                    existingNodeData.get(currentNarrationIndex)?.narrationUrl;
                  if (narrationUrl) {
                    console.log("[Story] Playing pre-generated narration");
                    speak(
                      steps[currentNarrationIndex].story,
                      "narrator",
                      narrationUrl
                    );
                    setHasNarratedCurrent(true);
                  }
                }
              }, 500); // Wait for fade animation to complete
            }}
            style={{ marginVertical: 24 }}
          />
        )}
        {/* Choices and divider below the latest narrative node */}
        {((choices && choices.length > 0) ||
          (loadedChoices && loadedChoices.length > 0) ||
          loading ||
          error) &&
          !showLoader && (
            <>
              {!loading && error && (
                <View style={{ marginVertical: 24, alignItems: "center" }}>
                  <ThemedText
                    style={[styles.errorText, { color: colors.accent }]}
                  >
                    {error || "An error occurred"}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={regenerate}
                    style={[
                      styles.retryButton,
                      {
                        backgroundColor: colors.accent,
                        borderColor: colors.border,
                        borderRadius: theme.styles.borderRadius,
                        borderWidth: theme.styles.borderWidth,
                      },
                    ]}
                  >
                    <ThemedText style={styles.retryButtonText}>
                      Try Again
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              )}
              {!loading &&
                !error &&
                ((choices && choices.length > 0) ||
                  (loadedChoices && loadedChoices.length > 0)) && (
                  console.log("[Story] Rendering choices:", { choices, loadedChoices, loading, error }),
                  <>
                    {/* Gradient divider with record button */}
                    <View style={styles.gradientBarContainer}>
                      <LinearGradient
                        colors={
                          theme.colors[isDark ? "dark" : "light"]
                            .gradientColors as any
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.gradientBarInline,
                          {
                            borderColor: colors.border,
                            borderRadius: theme.styles.borderRadius,
                            borderWidth: theme.styles.borderWidth,
                            flex: 1,
                          },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.gradientBarText,
                            {
                              fontFamily: theme.fonts.title,
                              color: isDark ? "#111" : "#111",
                            },
                          ]}
                        >
                          {t("whatWillYouDoNext")}
                        </ThemedText>
                      </LinearGradient>
                      <VoiceRecorder
                        onTranscript={(text) => handleChoice(text)}
                        disabled={loading}
                        storyContext={
                          steps.length > 0 ? steps[steps.length - 1].story : ""
                        }
                      />
                    </View>
                    {/* Choices */}
                    {(loadedChoices || choices || []).map((choice, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.choiceButton,
                          {
                            backgroundColor: colors.secondary,
                            borderColor: colors.border,
                            borderRadius: theme.styles.borderRadius,
                            borderWidth: theme.styles.borderWidth,
                            shadowColor: colors.border,
                            shadowOffset: theme.styles.shadowOffset,
                            shadowOpacity: theme.styles.shadowOpacity,
                            shadowRadius: theme.styles.shadowRadius,
                          },
                        ]}
                        onPress={() => handleChoice(choice)}
                      >
                        <ThemedText
                          style={[
                            styles.choiceButtonText,
                            {
                              fontFamily: theme.fonts.button,
                              color: colors.text,
                            },
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
                          {
                            fontFamily: theme.fonts.body,
                            backgroundColor: colors.background,
                          },
                        ]}
                      >
                        <>{t("or")}</>
                      </ThemedText>
                      <View style={styles.dividerLine} />
                    </View>
                    <TouchableOpacity
                      onPress={regenerate}
                      style={[
                        styles.regenButtonSmall,
                        {
                          backgroundColor: colors.accent,
                          borderColor: colors.border,
                          borderRadius: theme.styles.borderRadius,
                          borderWidth: theme.styles.borderWidth,
                          shadowColor: colors.border,
                          shadowOffset: theme.styles.shadowOffset,
                          shadowOpacity: theme.styles.shadowOpacity,
                          shadowRadius: theme.styles.shadowRadius,
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.regenButtonSmallText,
                          {
                            fontFamily: theme.fonts.button,
                            color: isDark ? "#000" : "#000",
                          },
                        ]}
                      >
                        {t("regenerateStory")}
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
    marginTop: 16,
    marginBottom: 20,
    gap: 5,
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
