import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { NarrationNavbar } from "@/components/NarrationNavbar";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { storyThemeMap } from "@/constants/Themes";
import { useTheme } from "@/contexts/ThemeContext";
import { useGenerateImage } from "@/hooks/useGenerateImage";
import { useGenerateStory } from "@/hooks/useGenerateStory";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useStoryPersistence } from "@/hooks/useStoryPersistence";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
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
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
    colors: any;
    theme: any;
    onLayout?: (e: LayoutChangeEvent) => void;
    isCurrentNarration: boolean;
    onSelectNarration: () => void;
    nodeId?: string;
    storyId?: string;
    onImageGenerated?: (imageUrl: string) => void;
    existingImageUrl?: string;
  }
>(({ story, choice, isDark, colors, theme, onLayout, isCurrentNarration, onSelectNarration, nodeId, storyId, onImageGenerated, existingImageUrl }, _ref) => {
  const {
    imageUrl,
    loading: imageLoading,
    error: imageError,
    regenerate: regenerateImage,
  } = useGenerateImage(story);

  useEffect(() => {
    // Only generate image if we don't have an existing one
    if (story && !existingImageUrl && !imageUrl && !imageLoading) {
      regenerateImage();
    }
  }, [story, existingImageUrl]); // Remove regenerateImage from deps to avoid infinite loop

  // Save image URL when generated
  useEffect(() => {
    if (imageUrl && onImageGenerated && !existingImageUrl) {
      onImageGenerated(imageUrl);
    }
  }, [imageUrl, onImageGenerated, existingImageUrl]);

  // Use existing image URL if available, otherwise use generated one
  const displayImageUrl = existingImageUrl || imageUrl;

  return (
    <View style={styles.storyBlock} onLayout={onLayout}>
      {choice && (
        <ThemedText
          style={[
            styles.choiceLabel,
            {
              fontFamily: theme.fonts.body,
              color: isDark ? colors.text : colors.text,
            },
          ]}
        >
          You chose: {choice}
        </ThemedText>
      )}
      {/* Story card container with shadow */}
      <View
        style={[
          styles.storyCardContainer,
          {
            shadowColor: colors.border,
            shadowOffset: theme.styles.shadowOffset,
            shadowOpacity: theme.styles.shadowOpacity,
            shadowRadius: theme.styles.shadowRadius,
            borderRadius: theme.styles.borderRadius,
          },
        ]}
      >
        {/* Image above the story text */}
        <View style={styles.imageContainer}>
          {imageLoading && !existingImageUrl && (
            <ActivityIndicator
              size="large"
              color={colors.text}
              style={{ marginVertical: 16 }}
            />
          )}
          {displayImageUrl && (
            <Animated.Image
              source={{ uri: displayImageUrl }}
              style={[
                styles.storyImage,
                {
                  borderColor: colors.border,
                  borderTopLeftRadius: theme.styles.borderRadius,
                  borderTopRightRadius: theme.styles.borderRadius,
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  borderWidth: theme.styles.borderWidth,
                  borderBottomWidth: 0,
                },
              ]}
              resizeMode="cover"
            />
          )}
          {imageError && (
            <TouchableOpacity
              onPress={regenerateImage}
              style={[
                styles.imageErrorButton,
                {
                  backgroundColor: colors.accent,
                  borderColor: colors.border,
                  borderRadius: theme.styles.borderRadius,
                  borderWidth: theme.styles.borderWidth,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.imageErrorText,
                  { fontFamily: theme.fonts.button, color: colors.text },
                ]}
              >
                Image failed to load. Tap to retry.
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
        <ThemedText
          style={[
            styles.storyText,
            {
              backgroundColor: colors.primary,
              color: colors.text,
              borderColor: colors.border,
              fontFamily: theme.fonts.body,
              borderTopLeftRadius: displayImageUrl ? 0 : theme.styles.borderRadius,
              borderTopRightRadius: displayImageUrl ? 0 : theme.styles.borderRadius,
              borderBottomLeftRadius: theme.styles.borderRadius,
              borderBottomRightRadius: theme.styles.borderRadius,
              borderWidth: theme.styles.borderWidth,
              borderTopWidth: displayImageUrl ? theme.styles.borderWidth : theme.styles.borderWidth,
            },
          ]}
        >
          {story}
        </ThemedText>
      </View>
      <TouchableOpacity
        onPress={onSelectNarration}
        style={[
          styles.selectNarrationButton,
          {
            backgroundColor: isCurrentNarration ? colors.accent : colors.secondary,
            borderColor: colors.border,
            borderWidth: theme.styles.borderWidth,
            borderRadius: theme.styles.borderRadius,
          }
        ]}
      >
        <ThemedText
          style={[
            styles.selectNarrationText,
            { 
              fontFamily: theme.fonts.button, 
              color: isCurrentNarration ? (isDark ? '#000' : '#000') : colors.text 
            }
          ]}
        >
          {isCurrentNarration ? 'Currently Playing' : 'Play This Part'}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
});

export default function StoryScreen() {
  const { seed, storyId } = useLocalSearchParams();
  const [steps, setSteps] = useState<StoryStep[]>([]); // Each step: {story, choice}
  const [history, setHistory] = useState<string[]>([]); // Just the choices for the hook
  const [currentNarrationIndex, setCurrentNarrationIndex] = useState<number | null>(null);
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  const [nodeIds, setNodeIds] = useState<string[]>([]);
  const [skipInitialGeneration, setSkipInitialGeneration] = useState(!!storyId);
  
  const { story, choices, loading, error, regenerate } = useGenerateStory(
    typeof seed === "string" && !skipInitialGeneration ? seed : undefined,
    history
  );
  const scrollViewRef = useRef<ScrollView>(null);
  const [choicesPanelHeight] = useState(
    new Animated.Value(CHOICES_PANE_HEIGHT)
  );
  const prevLoading = useRef(false);
  const colorScheme = useColorScheme();
  const { theme, isDark, setThemeName } = useTheme();
  const colors = isDark ? theme.colors.dark : theme.colors.light;
  const latestY = useRef<number | null>(null);
  const { speak, pause, resume, stop, isLoading: ttsLoading, isPlaying, progress, error: ttsError, volume, setVolume, getLastAudioUrl } = useTextToSpeech();
  const { 
    createStory, 
    saveStoryNode, 
    saveChoices, 
    getStoryWithNodes,
    loading: persistenceLoading,
    error: persistenceError 
  } = useStoryPersistence();
  const insets = useSafeAreaInsets();

  // Set theme based on story seed
  useEffect(() => {
    if (typeof seed === "string" && storyThemeMap[seed]) {
      setThemeName(storyThemeMap[seed]);
    }
  }, [seed, setThemeName]);

  // Track if we've loaded an existing story
  const [isExistingStoryLoaded, setIsExistingStoryLoaded] = useState(false);
  const [existingNodeData, setExistingNodeData] = useState<Map<number, any>>(new Map());

  // Load existing story if storyId is provided
  useEffect(() => {
    const loadExistingStory = async () => {
      if (typeof storyId === "string") {
        const storyData = await getStoryWithNodes(storyId);
        if (storyData) {
          setCurrentStoryId(storyId);
          const loadedSteps: StoryStep[] = [];
          const loadedHistory: string[] = [];
          const loadedNodeIds: string[] = [];
          const nodeDataMap = new Map();
          
          storyData.nodes.forEach((node) => {
            loadedSteps.push({
              story: node.story_text,
              choice: node.choice_made
            });
            if (node.choice_made) {
              loadedHistory.push(node.choice_made);
            }
            loadedNodeIds.push(node.id);
            // Store additional node data (like image URLs)
            nodeDataMap.set(node.node_index, {
              imageUrl: node.image_url,
              narrationUrl: node.narration_url
            });
          });
          
          setSteps(loadedSteps);
          setHistory(loadedHistory);
          setNodeIds(loadedNodeIds);
          setExistingNodeData(nodeDataMap);
          setIsExistingStoryLoaded(true);
          // Allow generation for new choices after loading
          setSkipInitialGeneration(false);
          
          // Set the latest story node as the current narration
          if (loadedSteps.length > 0) {
            setCurrentNarrationIndex(loadedSteps.length - 1);
            
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
    
    loadExistingStory();
  }, [storyId, getStoryWithNodes]);

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
            const node = await saveStoryNode(
              newStory.id,
              0,
              story,
              null
            );
            
            if (node) {
              setNodeIds([node.id]);
              
              // Save initial choices if any
              if (choices && choices.length > 0) {
                await saveChoices(node.id, choices);
              }
            }
          }
        }
        
        setSteps([{ story, choice: null }]);
        
        // Auto-narrate first story and set current narration index
        if (!ttsLoading && !isPlaying) {
          speak(story, 'narrator');
          setCurrentNarrationIndex(0);
        }
      };
      
      initializeStory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story, loading, error, currentStoryId, isExistingStoryLoaded, storyId]);

  // When a new choice is made, add the new story node and save to database
  useEffect(() => {
    // Skip if this is the first render after loading an existing story
    if (isExistingStoryLoaded && history.length < steps.length) {
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
        
        // Save the new node
        const node = await saveStoryNode(
          currentStoryId,
          nodeIndex,
          story,
          choiceMade
        );
        
        if (node) {
          setNodeIds(prev => [...prev, node.id]);
          
          // Save choices for this node if any
          if (choices && choices.length > 0) {
            await saveChoices(node.id, choices);
          }
        }
        
        setSteps((prev) => [
          ...prev,
          { story, choice: choiceMade },
        ]);
        
        // Auto-narrate new story content and update current narration index
        if (!ttsLoading && !isPlaying) {
          speak(story, 'narrator');
          setCurrentNarrationIndex(steps.length);
        }
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
    setHistory((prev) => [...prev, choice]);
  };

  const handleNarrationPlay = async () => {
    if (currentNarrationIndex !== null && steps[currentNarrationIndex]) {
      // Check if we have an existing narration URL for this node
      const existingNarrationUrl = existingNodeData.get(currentNarrationIndex)?.narrationUrl;
      await speak(steps[currentNarrationIndex].story, 'narrator', existingNarrationUrl);
      
      // If we generated a new narration, save it to the database
      if (!existingNarrationUrl) {
        const newAudioUrl = getLastAudioUrl();
        if (newAudioUrl && currentStoryId && nodeIds[currentNarrationIndex]) {
          const { supabase } = await import('@/lib/supabase');
          await supabase
            .from('story_nodes')
            .update({ narration_url: newAudioUrl })
            .eq('id', nodeIds[currentNarrationIndex]);
          
          // Update local data
          const currentData = existingNodeData.get(currentNarrationIndex) || {};
          existingNodeData.set(currentNarrationIndex, {
            ...currentData,
            narrationUrl: newAudioUrl
          });
        }
      }
    } else if (steps.length > 0) {
      // If no current narration, play the latest story
      const latestIndex = steps.length - 1;
      const existingNarrationUrl = existingNodeData.get(latestIndex)?.narrationUrl;
      await speak(steps[latestIndex].story, 'narrator', existingNarrationUrl);
      setCurrentNarrationIndex(latestIndex);
      
      // Save if new
      if (!existingNarrationUrl) {
        const newAudioUrl = getLastAudioUrl();
        if (newAudioUrl && currentStoryId && nodeIds[latestIndex]) {
          const { supabase } = await import('@/lib/supabase');
          await supabase
            .from('story_nodes')
            .update({ narration_url: newAudioUrl })
            .eq('id', nodeIds[latestIndex]);
          
          // Update local data
          const currentData = existingNodeData.get(latestIndex) || {};
          existingNodeData.set(latestIndex, {
            ...currentData,
            narrationUrl: newAudioUrl
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
        currentStoryText={currentNarrationIndex !== null && steps[currentNarrationIndex] ? steps[currentNarrationIndex].story : ''}
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
            paddingTop: navbarHeight 
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Narrative nodes */}
        {steps.map((step, idx) => (
          <StoryNode
            key={idx}
            story={step.story}
            choice={step.choice}
            isDark={isDark}
            colors={colors}
            theme={theme}
            onLayout={
              idx === steps.length - 1
                ? (e) => (latestY.current = e.nativeEvent.layout.y)
                : undefined
            }
            isCurrentNarration={currentNarrationIndex === idx}
            onSelectNarration={async () => {
              setCurrentNarrationIndex(idx);
              const existingNarrationUrl = existingNodeData.get(idx)?.narrationUrl;
              await speak(step.story, 'narrator', existingNarrationUrl);
              
              // Save if new
              if (!existingNarrationUrl) {
                const newAudioUrl = getLastAudioUrl();
                if (newAudioUrl && currentStoryId && nodeIds[idx]) {
                  const { supabase } = await import('@/lib/supabase');
                  await supabase
                    .from('story_nodes')
                    .update({ narration_url: newAudioUrl })
                    .eq('id', nodeIds[idx]);
                  
                  // Update local data
                  const currentData = existingNodeData.get(idx) || {};
                  existingNodeData.set(idx, {
                    ...currentData,
                    narrationUrl: newAudioUrl
                  });
                }
              }
            }}
            nodeId={nodeIds[idx]}
            storyId={currentStoryId || undefined}
            existingImageUrl={existingNodeData.get(idx)?.imageUrl}
            onImageGenerated={async (imageUrl) => {
              // Update the node with the generated image URL
              if (currentStoryId && nodeIds[idx]) {
                const { supabase } = await import('@/lib/supabase');
                await supabase
                  .from('story_nodes')
                  .update({ image_url: imageUrl })
                  .eq('id', nodeIds[idx]);
              }
            }}
          />
        ))}
        {/* Choices and divider below the latest narrative node */}
        {((choices && choices.length > 0) || loading) && (
          <>
            {/* Only show spinner when loading, otherwise show divider, choices, and regenerate button */}
            {loading ? (
              <ActivityIndicator
                size="large"
                color={colors.text}
                style={{ marginVertical: 24 }}
              />
            ) : (
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
                      What will you do next?
                    </ThemedText>
                  </LinearGradient>
                  <VoiceRecorder
                    onTranscript={(text) => handleChoice(text)}
                    disabled={loading}
                    storyContext={steps.length > 0 ? steps[steps.length - 1].story : ''}
                  />
                </View>
                {/* Choices */}
                {choices.map((choice, idx) => (
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
                        { fontFamily: theme.fonts.button, color: colors.text },
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
                    <>{"or"}</>
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
    alignSelf: 'center',
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
