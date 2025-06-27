import { LanguageDropdown } from "@/components/LanguageDropdown";
import { StoriesDrawer } from "@/components/StoriesDrawer";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  enchantedForestTheme,
  retroFutureTheme,
  storyThemeMap,
} from "@/constants/Themes";
import { useTranslation } from "@/constants/translations";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Story, useStoryPersistence } from "@/hooks/useStoryPersistence";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STORY_SEEDS = [
  "A magical forest adventure",
  "A lost robot in space",
  "The secret life of a city cat",
  "A fairy's quest to save the moon",
];

type SectionItem =
  | { type: "header"; key: string }
  | { type: "continueButton"; key: string }
  | { type: "newAdventureTitle"; key: string }
  | { type: "seed"; key: string; data: string }
  | { type: "startButton"; key: string };

export default function HomeScreen() {
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);
  const [savedStories, setSavedStories] = useState<Story[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme, setThemeName, isDark } = useTheme();
  const colors = isDark ? theme.colors.dark : theme.colors.light;
  const { getUserStories } = useStoryPersistence();
  const { user } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (selectedSeed && storyThemeMap[selectedSeed]) {
      setThemeName(storyThemeMap[selectedSeed]);
    }
  }, [selectedSeed, setThemeName]);

  // Load user's stories
  useEffect(() => {
    const loadStories = async () => {
      if (user) {
        try {
          const userStories = await getUserStories();
          setSavedStories(userStories);
        } catch (error) {
          console.error("Error loading stories:", error);
          setSavedStories([]);
        }
      }
    };

    loadStories();
  }, [user, getUserStories]);

  // Reload stories when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (user) {
        const loadStories = async () => {
          try {
            const userStories = await getUserStories();
            setSavedStories(userStories);
          } catch (error) {
            console.error("Error loading stories:", error);
          }
        };
        loadStories();
      }
    }, [user, getUserStories])
  );

  const handleStartStory = () => {
    if (selectedSeed) {
      router.push({ pathname: "/Story", params: { seed: selectedSeed } });
    }
  };

  const handleContinueStory = (storyId: string, seed: string) => {
    router.push({ pathname: "/Story", params: { seed, storyId } });
  };

  // Prepare all sections as data for a single FlatList
  const sections: SectionItem[] = [];

  // Header section
  sections.push({ type: "header", key: "header" });

  // Continue button - only show if there are saved stories
  if (!storiesLoading && savedStories.length > 0) {
    sections.push({ type: "continueButton", key: "continueButton" });
  }

  // New adventure section
  sections.push({ type: "newAdventureTitle", key: "newAdventureTitle" });
  STORY_SEEDS.forEach((seed) => {
    sections.push({ type: "seed", key: seed, data: seed });
  });
  sections.push({ type: "startButton", key: "startButton" });

  const renderItem = ({ item }: { item: SectionItem }) => {
    switch (item.type) {
      case "header":
        return (
          <>
            <ThemedText
              type="title"
              style={[styles.header, { fontFamily: theme.fonts.title }]}
            >
              {t("welcome")}
              {"\n"}
              {t("appName")}
            </ThemedText>
          </>
        );

      case "continueButton":
        return (
          <TouchableOpacity
            style={[
              styles.continueButton,
              {
                backgroundColor: colors.secondary,
                borderRadius: theme.styles.borderRadius,
                borderWidth: theme.styles.borderWidth,
                borderColor: colors.border,
                shadowColor: colors.border,
                shadowOffset: theme.styles.shadowOffset,
                shadowOpacity: theme.styles.shadowOpacity,
                shadowRadius: theme.styles.shadowRadius,
              },
            ]}
            onPress={() => setDrawerVisible(true)}
          >
            <ThemedText
              type="defaultSemiBold"
              style={[
                styles.continueButtonText,
                { fontFamily: theme.fonts.button, color: colors.text },
              ]}
            >
              {t("continueStory")}
            </ThemedText>
            <Ionicons
              name="chevron-up"
              size={20}
              color={colors.text}
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        );

      case "newAdventureTitle":
        return (
          <ThemedText
            type="subtitle"
            style={[
              styles.sectionTitle,
              { fontFamily: theme.fonts.title, color: colors.text },
            ]}
          >
            {t("startNewAdventure")}
          </ThemedText>
        );

      case "seed":
        const seed = item.data;
        const seedTheme =
          storyThemeMap[seed] === "enchantedForest"
            ? enchantedForestTheme
            : retroFutureTheme;
        const seedColors = isDark
          ? seedTheme.colors.dark
          : seedTheme.colors.light;

        return (
          <TouchableOpacity
            style={[
              styles.seedCard,
              {
                backgroundColor:
                  selectedSeed === seed
                    ? seedColors.secondary
                    : seedColors.primary,
                borderRadius: seedTheme.styles.borderRadius,
                borderWidth: seedTheme.styles.borderWidth,
                borderColor: seedColors.border,
                shadowColor: seedColors.border,
                shadowOffset: seedTheme.styles.shadowOffset,
                shadowOpacity: seedTheme.styles.shadowOpacity,
                shadowRadius: seedTheme.styles.shadowRadius,
              },
            ]}
            onPress={() => setSelectedSeed(seed)}
          >
            <ThemedText
              type="defaultSemiBold"
              style={[
                styles.seedCardText,
                { fontFamily: seedTheme.fonts.button, color: seedColors.text },
              ]}
            >
              {t(seed)}
            </ThemedText>
          </TouchableOpacity>
        );

      case "startButton":
        return (
          <TouchableOpacity
            style={[
              styles.startButton,
              {
                backgroundColor: !selectedSeed
                  ? colors.secondary
                  : colors.accent,
                borderRadius: theme.styles.borderRadius,
                borderWidth: theme.styles.borderWidth,
                borderColor: colors.border,
                shadowColor: colors.border,
                shadowOffset: theme.styles.shadowOffset,
                shadowOpacity: theme.styles.shadowOpacity,
                shadowRadius: theme.styles.shadowRadius,
              },
              !selectedSeed && styles.disabledButton,
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
              {t("startStory")}
            </ThemedText>
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={styles.headerContainer}>
        <LanguageDropdown />
      </View>
      <ThemedView style={styles.container}>
        <FlatList
          data={sections}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        />
      </ThemedView>
      <StoriesDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        stories={savedStories}
        loading={storiesLoading}
        onSelectStory={handleContinueStory}
        onRefresh={async () => {
          if (user) {
            try {
              const userStories = await getUserStories();
              setSavedStories(userStories);
            } catch (error) {
              console.error("Error loading stories:", error);
            }
          }
        }}
      />
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
    backgroundColor: "transparent",
  },
  headerContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    right: 20,
    zIndex: 1000,
  },
  listContent: {
    padding: 24,
    alignItems: "center",
  },
  header: {
    marginBottom: 12,
    textAlign: "center",
    fontSize: 24,
    lineHeight: 32,
  },
  subtitle: {
    marginTop: 32,
    marginBottom: 16,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
  },
  seedList: {
    width: "100%",
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  seedCard: {
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 4,
    alignItems: "center",
    minHeight: 56,
    justifyContent: "center",
    width: 350,
    alignSelf: "center",
  },
  selectedSeedCard: {
    transform: [{ translateX: -2 }, { translateY: -2 }],
    marginTop: 2,
    marginLeft: 2,
    marginRight: 2,
    marginBottom: 2,
  },
  startButton: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: "center",
    marginBottom: 24,
    minHeight: 56,
    justifyContent: "center",
    minWidth: 200,
  },
  disabledButton: {
    opacity: 0.6,
  },
  seedCardText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  startButtonText: {
    fontSize: 16,
    lineHeight: 22,
  },
  startButtonTextEnabled: {
    color: "#000",
  },
  startButtonTextDisabled: {
    color: "#636E72",
  },
  sectionTitle: {
    marginTop: 32,
    marginBottom: 16,
    textAlign: "center",
    fontSize: 18,
    lineHeight: 24,
  },
  savedStoriesContainer: {
    width: "100%",
    marginBottom: 32,
  },
  storyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 4,
    width: 350,
    alignSelf: "center",
  },
  storyCardContent: {
    flex: 1,
  },
  storyTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  storyDate: {
    fontSize: 12,
  },
  loader: {
    marginVertical: 20,
  },
  noStoriesContainer: {
    alignItems: "center",
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  noStoriesText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  refreshButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  refreshButtonText: {
    fontSize: 14,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 20,
    marginBottom: 12,
    minHeight: 56,
    minWidth: 200,
  },
  continueButtonText: {
    fontSize: 16,
    lineHeight: 22,
  },
});
