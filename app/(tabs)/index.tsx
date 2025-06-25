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
  View,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { storyThemeMap, retroFutureTheme, enchantedForestTheme } from "@/constants/Themes";
import { useStoryPersistence, Story } from "@/hooks/useStoryPersistence";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";

const STORY_SEEDS = [
  "A magical forest adventure",
  "A lost robot in space",
  "The secret life of a city cat",
  "A fairy's quest to save the moon",
];

export default function HomeScreen() {
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);
  const [savedStories, setSavedStories] = useState<Story[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { theme, setThemeName, isDark } = useTheme();
  const colors = isDark ? theme.colors.dark : theme.colors.light;
  const { getUserStories } = useStoryPersistence();
  const { user } = useAuth();

  useEffect(() => {
    if (selectedSeed && storyThemeMap[selectedSeed]) {
      setThemeName(storyThemeMap[selectedSeed]);
    }
  }, [selectedSeed, setThemeName]);

  // Load saved stories
  useEffect(() => {
    let mounted = true;
    
    const loadStories = async () => {
      if (!mounted || !user) return;
      
      try {
        setStoriesLoading(true);
        const stories = await getUserStories();
        if (mounted) {
          setSavedStories(stories);
          setStoriesLoading(false);
        }
      } catch (error) {
        console.error('Error loading stories:', error);
        if (mounted) {
          setSavedStories([]);
          setStoriesLoading(false);
        }
      }
    };
    
    if (user) {
      loadStories();
    } else {
      setStoriesLoading(false);
      setSavedStories([]);
    }
    
    return () => {
      mounted = false;
    };
  }, [getUserStories, user]);

  const handleStartStory = () => {
    if (selectedSeed) {
      router.push({ pathname: "/Story", params: { seed: selectedSeed } });
    }
  };

  const handleContinueStory = (storyId: string, seed: string) => {
    router.push({ pathname: "/Story", params: { seed, storyId } });
  };

  // Prepare all sections as data for a single FlatList
  const sections = [];
  
  // Header section
  sections.push({ type: 'header', key: 'header' });
  
  // Saved stories section
  if (savedStories.length > 0) {
    sections.push({ type: 'savedStoriesTitle', key: 'savedStoriesTitle' });
    if (storiesLoading) {
      sections.push({ type: 'loading', key: 'loading' });
    } else {
      savedStories.forEach((story) => {
        sections.push({ type: 'savedStory', key: story.id, data: story });
      });
    }
  }
  
  // New adventure section
  sections.push({ type: 'newAdventureTitle', key: 'newAdventureTitle' });
  STORY_SEEDS.forEach((seed) => {
    sections.push({ type: 'seed', key: seed, data: seed });
  });
  sections.push({ type: 'startButton', key: 'startButton' });

  const renderItem = ({ item }) => {
    switch (item.type) {
      case 'header':
        return (
          <>
            <ThemedText type="title" style={[styles.header, { fontFamily: theme.fonts.title }]}>
              Welcome to{'\n'}Dream Fairy!
            </ThemedText>
          </>
        );
        
      case 'savedStoriesTitle':
        return (
          <ThemedText type="subtitle" style={[styles.sectionTitle, { fontFamily: theme.fonts.title, color: colors.text }]}>
            Continue Your Adventures
          </ThemedText>
        );
        
      case 'loading':
        return <ActivityIndicator size="large" color={colors.text} style={styles.loader} />;
        
      case 'savedStory':
        const story = item.data;
        const storyTheme = storyThemeMap[story.seed] === 'enchantedForest' ? enchantedForestTheme : retroFutureTheme;
        const storyColors = isDark ? storyTheme.colors.dark : storyTheme.colors.light;
        
        return (
          <TouchableOpacity
            style={[
              styles.storyCard,
              {
                backgroundColor: storyColors.primary,
                borderRadius: storyTheme.styles.borderRadius,
                borderWidth: storyTheme.styles.borderWidth,
                borderColor: storyColors.border,
                shadowColor: storyColors.border,
                shadowOffset: storyTheme.styles.shadowOffset,
                shadowOpacity: storyTheme.styles.shadowOpacity,
                shadowRadius: storyTheme.styles.shadowRadius,
              },
            ]}
            onPress={() => handleContinueStory(story.id, story.seed)}
          >
            <View style={styles.storyCardContent}>
              <ThemedText style={[styles.storyTitle, { fontFamily: storyTheme.fonts.button, color: storyColors.text }]}>
                {story.title || story.seed}
              </ThemedText>
              <ThemedText style={[styles.storyDate, { fontFamily: storyTheme.fonts.body, color: storyColors.text, opacity: 0.7 }]}>
                {new Date(story.updated_at).toLocaleDateString()}
              </ThemedText>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={storyColors.text} 
              style={{ opacity: 0.5 }}
            />
          </TouchableOpacity>
        );
        
      case 'newAdventureTitle':
        return (
          <ThemedText type="subtitle" style={[styles.sectionTitle, { fontFamily: theme.fonts.title, color: colors.text }]}>
            Start a New Adventure
          </ThemedText>
        );
        
      case 'seed':
        const seed = item.data;
        const seedTheme = storyThemeMap[seed] === 'enchantedForest' ? enchantedForestTheme : retroFutureTheme;
        const seedColors = isDark ? seedTheme.colors.dark : seedTheme.colors.light;
        
        return (
          <TouchableOpacity
            style={[
              styles.seedCard,
              {
                backgroundColor: selectedSeed === seed ? seedColors.secondary : seedColors.primary,
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
            <ThemedText type="defaultSemiBold" style={[styles.seedCardText, { fontFamily: seedTheme.fonts.button, color: seedColors.text }]}>
              {seed}
            </ThemedText>
          </TouchableOpacity>
        );
        
      case 'startButton':
        return (
          <TouchableOpacity
            style={[
              styles.startButton,
              {
                backgroundColor: !selectedSeed ? colors.secondary : colors.accent,
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
        );
        
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ThemedView style={styles.container}>
        <FlatList
          data={sections}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        />
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
    backgroundColor: "transparent",
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
    width: "100%",
    maxWidth: 400,
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
    width: "100%",
    maxWidth: 400,
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
});
