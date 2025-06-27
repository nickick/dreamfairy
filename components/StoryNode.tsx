import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  LayoutChangeEvent,
} from "react-native";
import { ThemedText } from "./ThemedText";

interface StoryNodeProps {
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
  existingImageUrl?: string;
  t: (key: string, params?: Record<string, string>) => string;
}

export const StoryNode = React.forwardRef<View, StoryNodeProps>(
  (
    {
      story,
      choice,
      isDark,
      colors,
      theme,
      onLayout,
      isCurrentNarration,
      onSelectNarration,
      nodeId,
      storyId,
      existingImageUrl,
      t,
    },
    ref
  ) => {
    // Use the image URL passed from parent
    const displayImageUrl = existingImageUrl;
    const imageLoading = !displayImageUrl && !existingImageUrl;

    return (
      <View ref={ref} style={styles.storyBlock} onLayout={onLayout}>
        {choice && (
          <ThemedText
            style={[
              styles.choiceLabel,
              {
                fontFamily: theme.fonts.body,
                color: colors.text,
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
            {/* Image error handling removed - handled by parent */}
          </View>
          <ThemedText
            style={[
              styles.storyText,
              {
                backgroundColor: colors.primary,
                color: colors.text,
                borderColor: colors.border,
                fontFamily: theme.fonts.body,
                borderTopLeftRadius: displayImageUrl
                  ? 0
                  : theme.styles.borderRadius,
                borderTopRightRadius: displayImageUrl
                  ? 0
                  : theme.styles.borderRadius,
                borderBottomLeftRadius: theme.styles.borderRadius,
                borderBottomRightRadius: theme.styles.borderRadius,
                borderWidth: theme.styles.borderWidth,
                borderTopWidth: theme.styles.borderWidth,
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
              backgroundColor: isCurrentNarration
                ? colors.accent
                : colors.secondary,
              borderColor: colors.border,
              borderWidth: theme.styles.borderWidth,
              borderRadius: theme.styles.borderRadius,
            },
          ]}
        >
          <ThemedText
            style={[
              styles.selectNarrationText,
              {
                fontFamily: theme.fonts.button,
                color: isCurrentNarration
                  ? isDark
                    ? "#000"
                    : "#000"
                  : colors.text,
              },
            ]}
          >
            {isCurrentNarration ? t("currentlyPlaying") : t("playThisPart")}
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  }
);

StoryNode.displayName = "StoryNode";

const styles = StyleSheet.create({
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
  choiceLabel: {
    fontStyle: "normal",
    marginBottom: 8,
    textAlign: "center",
    fontSize: 10,
    opacity: 0.7,
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
});