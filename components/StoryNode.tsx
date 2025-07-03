import React from "react";
import {
  ActivityIndicator,
  Animated,
  LayoutChangeEvent,
  StyleSheet,
  TouchableOpacity,
  View,
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
    // Use existing image URL if provided
    const imageUrl = existingImageUrl;
    const imageLoading = false; // Loading is handled by parent

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
            {imageUrl && (
              <Animated.Image
                source={{ uri: imageUrl }}
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
                borderTopLeftRadius: imageUrl ? 0 : theme.styles.borderRadius,
                borderTopRightRadius: imageUrl ? 0 : theme.styles.borderRadius,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                borderWidth: theme.styles.borderWidth,
                borderTopWidth: imageUrl ? theme.styles.borderWidth : 0,
                borderBottomWidth: 0,
              },
            ]}
          >
            {story}
          </ThemedText>
          {/* Footer with play button */}
          <TouchableOpacity
            onPress={onSelectNarration}
            style={[
              styles.storyFooter,
              {
                backgroundColor: colors.primary,
                borderColor: colors.border,
                borderBottomLeftRadius: theme.styles.borderRadius,
                borderBottomRightRadius: theme.styles.borderRadius,
                borderWidth: theme.styles.borderWidth,
                borderTopWidth: 0,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.footerText,
                {
                  fontFamily: theme.fonts.button,
                  color: isCurrentNarration
                    ? isDark
                      ? "#fff"
                      : "#000"
                    : colors.text,
                  textDecorationLine: "underline",
                },
              ]}
            >
              {isCurrentNarration ? t("currentlyPlaying") : t("playThisPart")}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

StoryNode.displayName = "StoryNode";

const styles = StyleSheet.create({
  storyBlock: {
    marginBottom: 12,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
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
  storyFooter: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
  },
});
