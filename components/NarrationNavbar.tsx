import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import { StyleSheet, View } from "react-native";
import { NarrationControls } from "./NarrationControls";

interface NarrationNavbarProps {
  currentStoryText: string;
  ttsLoading: boolean;
  isPlaying: boolean;
  progress: number;
  ttsError: string | null;
  onSpeak: () => void;
  onPause: () => void;
  onStop: () => void;
  showControls: boolean;
  narrationPending?: boolean;
}

export function NarrationNavbar({
  currentStoryText,
  ttsLoading,
  isPlaying,
  progress,
  ttsError,
  onSpeak,
  onPause,
  onStop,
  showControls,
  narrationPending = false,
}: NarrationNavbarProps) {
  const { theme, isDark } = useTheme();
  const colors = isDark ? theme.colors.dark : theme.colors.light;

  if (!showControls) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          borderBottomWidth: theme.styles.borderWidth,
          // Remove safe area padding, use consistent 5px instead
          paddingTop: 0,
        },
      ]}
    >
      <View style={styles.content}>
        <NarrationControls
          isLoading={ttsLoading}
          isPlaying={isPlaying}
          progress={progress}
          onPlay={onSpeak}
          onPause={onPause}
          onStop={onStop}
          error={ttsError}
          currentStoryText={currentStoryText}
          narrationPending={narrationPending}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  content: {
    paddingHorizontal: 25,
    paddingTop: 5,
    paddingBottom: 5,
  },
});
