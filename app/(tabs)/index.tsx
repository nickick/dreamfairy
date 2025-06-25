import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { storyThemeMap } from "@/constants/Themes";

const STORY_SEEDS = [
  "A magical forest adventure",
  "A lost robot in space",
  "The secret life of a city cat",
  "A fairy's quest to save the moon",
];

export default function HomeScreen() {
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { theme, setThemeName, isDark } = useTheme();
  const colors = isDark ? theme.colors.dark : theme.colors.light;

  useEffect(() => {
    if (selectedSeed && storyThemeMap[selectedSeed]) {
      setThemeName(storyThemeMap[selectedSeed]);
    }
  }, [selectedSeed, setThemeName]);

  const handleStartStory = () => {
    if (selectedSeed) {
      router.push({ pathname: "/Story", params: { seed: selectedSeed } });
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ThemedView
        style={[styles.container, { paddingBottom: insets.bottom + 24 }]}
      >
        <ThemedText type="title" style={[styles.header, { fontFamily: theme.fonts.title }]}>
          Welcome to Dream Fairy!
        </ThemedText>
        <ThemedText type="subtitle" style={[styles.subtitle, { fontFamily: theme.fonts.title }]}>
          Choose a story seed to begin your adventure:
        </ThemedText>
        <FlatList
          data={STORY_SEEDS}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.seedCard,
                {
                  backgroundColor: selectedSeed === item ? colors.secondary : colors.primary,
                  borderRadius: theme.styles.borderRadius,
                  borderWidth: theme.styles.borderWidth,
                  borderColor: colors.border,
                  shadowColor: colors.border,
                  shadowOffset: theme.styles.shadowOffset,
                  shadowOpacity: theme.styles.shadowOpacity,
                  shadowRadius: theme.styles.shadowRadius,
                },
                selectedSeed === item && styles.selectedSeedCard,
              ]}
              onPress={() => setSelectedSeed(item)}
            >
              <ThemedText type="defaultSemiBold" style={[styles.seedCardText, { fontFamily: theme.fonts.button }]}>
                {item}
              </ThemedText>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.seedList}
        />
        <TouchableOpacity
          style={[
            styles.startButton,
            {
              backgroundColor: !selectedSeed ? colors.icon : colors.accent,
              borderRadius: theme.styles.borderRadius,
              borderWidth: theme.styles.borderWidth,
              borderColor: colors.border,
              shadowColor: colors.border,
              shadowOffset: theme.styles.shadowOffset,
              shadowOpacity: theme.styles.shadowOpacity,
              shadowRadius: theme.styles.shadowRadius,
            },
            !selectedSeed && styles.disabledButton
          ]}
          onPress={handleStartStory}
          disabled={!selectedSeed}
        >
          <ThemedText
            type="defaultSemiBold"
            style={[
              styles.startButtonText,
              { fontFamily: theme.fonts.button },
              !selectedSeed
                ? styles.startButtonTextDisabled
                : styles.startButtonTextEnabled,
            ]}
          >
            Start Story
          </ThemedText>
        </TouchableOpacity>
        {/* Placeholder for future: Your Stories */}
        {/* <ThemedText type="subtitle" style={{ marginTop: 32 }}>
          Your Stories (Coming Soon)
        </ThemedText> */}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "web" ? 32 : 0,
  },
  container: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  header: {
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 32,
    marginBottom: 16,
    textAlign: "center",
  },
  seedList: {
    width: "100%",
    marginBottom: 24,
  },
  seedCard: {
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  selectedSeedCard: {
    transform: [{ translateX: -2 }, { translateY: -2 }],
  },
  startButton: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: "center",
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  seedCardText: {
    color: "#2D3436",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  startButtonText: {
    fontSize: 14,
  },
  startButtonTextEnabled: {
    color: "#F5F3F4",
  },
  startButtonTextDisabled: {
    color: "#636E72",
  },
});
