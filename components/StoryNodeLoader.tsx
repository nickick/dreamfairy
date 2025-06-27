import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";

export interface LoadingStates {
  text: boolean;
  image: boolean;
  narration: boolean;
  choices: boolean;
}

interface StoryNodeLoaderProps {
  states: LoadingStates;
  onComplete?: () => void;
  style?: ViewStyle;
}

interface LoadingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  isComplete: boolean;
  label: string;
  color: string;
  delay: number;
}

const LoadingItem: React.FC<LoadingItemProps> = ({
  icon,
  isComplete,
  color,
  delay,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!isComplete) {
      // Start pulsing animation with delay
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.2,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, delay);
    } else {
      // Stop pulsing and fade to full opacity
      pulseAnim.stopAnimation();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isComplete, pulseAnim, fadeAnim, delay]);

  return (
    <Animated.View
      style={[
        styles.iconContainer,
        {
          opacity: isComplete ? fadeAnim : 0.3,
          transform: [{ scale: isComplete ? 1 : pulseAnim }],
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={32}
        color={isComplete ? color : `${color}66`}
      />
    </Animated.View>
  );
};

export function StoryNodeLoader({
  states,
  onComplete,
  style,
}: StoryNodeLoaderProps) {
  const { theme, isDark } = useTheme();
  const colors = isDark ? theme.colors.dark : theme.colors.light;
  const containerFadeAnim = useRef(new Animated.Value(1)).current;
  const hasCalledComplete = useRef(false);

  const allComplete =
    states.text && states.image && states.narration && states.choices;

  useEffect(() => {
    if (allComplete && onComplete && !hasCalledComplete.current) {
      hasCalledComplete.current = true;
      // Fade out the entire loader
      Animated.timing(containerFadeAnim, {
        toValue: 0,
        duration: 500,
        delay: 300,
        useNativeDriver: true,
      }).start(() => {
        onComplete();
      });
    }
  }, [allComplete, onComplete, containerFadeAnim]);

  const loadingItems = [
    {
      icon: "document-text" as keyof typeof Ionicons.glyphMap,
      isComplete: states.text,
      label: "Story",
      delay: 0,
    },
    {
      icon: "image" as keyof typeof Ionicons.glyphMap,
      isComplete: states.image,
      label: "Image",
      delay: 200,
    },
    {
      icon: "volume-high" as keyof typeof Ionicons.glyphMap,
      isComplete: states.narration,
      label: "Voice",
      delay: 400,
    },
    {
      icon: "git-branch" as keyof typeof Ionicons.glyphMap,
      isComplete: states.choices,
      label: "Choices",
      delay: 600,
    },
  ];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.primary,
          borderColor: colors.border,
          borderRadius: theme.styles.borderRadius,
          borderWidth: theme.styles.borderWidth,
          shadowColor: colors.border,
          shadowOffset: theme.styles.shadowOffset,
          shadowOpacity: theme.styles.shadowOpacity,
          shadowRadius: theme.styles.shadowRadius,
          opacity: containerFadeAnim,
        },
        style,
      ]}
    >
      <View style={styles.gridContainer}>
        {loadingItems.map((item) => (
          <LoadingItem
            key={item.label}
            icon={item.icon}
            isComplete={item.isComplete}
            label={item.label}
            color={colors.accent}
            delay={item.delay}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 140,
    justifyContent: "space-between",
  },
  iconContainer: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
});
