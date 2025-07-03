import React, { MutableRefObject } from "react";
import { StoryNodeLoader } from "./StoryNodeLoader";

interface StoryNodeLoaderWrapperProps {
  steps: { story: string }[];
  loadingStates: any;
  loading: boolean;
  ttsLoading: boolean;
  isPlaying: boolean;
  hasNarratedCurrent: boolean;
  setShowLoader: (show: boolean) => void;
  setCurrentNarrationIndex: (idx: number) => void;
  speak: (
    text: string,
    voiceType?: "narrator" | "child" | "fairy",
    existingAudioUrl?: string
  ) => Promise<void>;
  setHasNarratedCurrent: (val: boolean) => void;
  setAutoPlayNodeIndex: (idx: number | null) => void;
  autoPlayNodeIndex: number | null;
  pendingAssets: any;
  existingNodeData: Map<number, any>;
  narrationTimeoutRef: MutableRefObject<any>;
  style?: any;
}

export const StoryNodeLoaderWrapper: React.FC<StoryNodeLoaderWrapperProps> = ({
  steps,
  loadingStates,
  loading,
  ttsLoading,
  isPlaying,
  hasNarratedCurrent,
  setShowLoader,
  setCurrentNarrationIndex,
  speak,
  setHasNarratedCurrent,
  setAutoPlayNodeIndex,
  autoPlayNodeIndex,
  pendingAssets,
  existingNodeData,
  narrationTimeoutRef,
  style,
}) => {
  if (steps.length === 0) {
    // Show loader even when no steps yet (initial load)
    return (
      <StoryNodeLoader
        key={`loader-initial`}
        states={loadingStates}
        onComplete={() => {}}
        style={style}
      />
    );
  }

  // When generating a new node, we're checking for assets for a node that doesn't exist yet
  // So we should check if we're waiting for new content (loading is true)
  const isWaitingForNewContent =
    loading ||
    !loadingStates.text ||
    !loadingStates.image ||
    !loadingStates.narration ||
    !loadingStates.choices;

  // Only show loader if we're waiting for new content
  if (isWaitingForNewContent) {
    return (
      <StoryNodeLoader
        key={`loader-${steps.length}`}
        states={loadingStates}
        onComplete={() => {
          if (narrationTimeoutRef.current) {
            clearTimeout(narrationTimeoutRef.current);
          }
          narrationTimeoutRef.current = setTimeout(() => {
            setShowLoader(false);
            const latestIndex = steps.length - 1;
            setCurrentNarrationIndex(latestIndex);

            const narrationUrlToPlay =
              (pendingAssets?.nodeIndex === latestIndex
                ? pendingAssets?.narrationUrl
                : null) || existingNodeData.get(latestIndex)?.narrationUrl;
            if (
              !ttsLoading &&
              !isPlaying &&
              !hasNarratedCurrent &&
              narrationUrlToPlay &&
              latestIndex === steps.length - 1 &&
              autoPlayNodeIndex === latestIndex
            ) {
              speak(steps[latestIndex].story, "narrator", narrationUrlToPlay);
              setHasNarratedCurrent(true);
              setAutoPlayNodeIndex(null);
            }
          }, 500);
        }}
        style={style}
      />
    );
  } else {
    // All assets ready, hide loader and auto-play narration
    if (narrationTimeoutRef.current) {
      clearTimeout(narrationTimeoutRef.current);
    }
    narrationTimeoutRef.current = setTimeout(() => {
      setShowLoader(false);
      const latestIndex = steps.length - 1;
      setCurrentNarrationIndex(latestIndex);

      const nodeData = existingNodeData.get(latestIndex);
      const narrationUrlToPlay =
        (pendingAssets?.nodeIndex === latestIndex
          ? pendingAssets?.narrationUrl
          : null) || nodeData?.narrationUrl;
      if (
        !ttsLoading &&
        !isPlaying &&
        !hasNarratedCurrent &&
        narrationUrlToPlay &&
        latestIndex === steps.length - 1 &&
        autoPlayNodeIndex === latestIndex
      ) {
        speak(steps[latestIndex].story, "narrator", narrationUrlToPlay);
        setHasNarratedCurrent(true);
        setAutoPlayNodeIndex(null);
      }
    }, 100);
    return null;
  }
};
