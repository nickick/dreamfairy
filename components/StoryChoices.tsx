import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "./ThemedText";
import { VoiceRecorder } from "./VoiceRecorder";

interface StoryChoicesProps {
  choices: string[];
  loading: boolean;
  error: string | null;
  onChoice: (choice: string) => void;
  onRegenerate: () => void;
  theme: any;
  isDark: boolean;
  colors: any;
  t: (key: string) => string;
  steps: any[];
}

export const StoryChoices: React.FC<StoryChoicesProps> = ({
  choices,
  loading,
  error,
  onChoice,
  onRegenerate,
  theme,
  isDark,
  colors,
  t,
  steps,
}) => {
  console.log("[RENDER] choices:", choices);
  return (
    <>
      {/* Gradient divider with record button */}
      <View style={styles.gradientBarContainer}>
        <LinearGradient
          colors={theme.colors[isDark ? "dark" : "light"].gradientColors as any}
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
                color: isDark ? "#ffffff" : "#111",
              },
            ]}
          >
            {t("whatWillYouDoNext")}
          </ThemedText>
        </LinearGradient>
        <VoiceRecorder
          onTranscript={onChoice}
          disabled={loading}
          storyContext={steps.length > 0 ? steps[steps.length - 1].story : ""}
        />
      </View>
      {/* Choices */}
      {(choices || []).map((choice, idx) => (
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
          onPress={() => onChoice(choice)}
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
        onPress={onRegenerate}
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
  );
};

const styles = StyleSheet.create({
  gradientBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 5,
    marginTop: 0,
    marginBottom: 5,
  },
  gradientBarInline: {
    width: "100%",
    height: 56,
    paddingHorizontal: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  gradientBarText: {
    fontWeight: "normal",
    fontSize: 14,
    textAlign: "center",
    letterSpacing: 0.2,
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
  choiceButtonText: {
    fontWeight: "normal",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
  orDividerContainerInline: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
    width: "100%",
    position: "relative",
    height: 24,
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
  regenButtonSmallText: {
    fontWeight: "normal",
    fontSize: 10,
  },
});
