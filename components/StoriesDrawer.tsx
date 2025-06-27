import React, { useEffect, useRef } from 'react';
import { useTranslation } from '@/constants/translations';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  FlatList,
  Dimensions,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import { Story, useStoryPersistence } from '@/hooks/useStoryPersistence';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  enchantedForestTheme,
  retroFutureTheme,
  storyThemeMap,
} from '@/constants/Themes';

interface StoriesDrawerProps {
  visible: boolean;
  onClose: () => void;
  stories: Story[];
  loading: boolean;
  onSelectStory: (storyId: string, seed: string) => void;
  onRefresh: () => void;
}

const { height } = Dimensions.get('window');
const DRAWER_HEIGHT = height * 0.7;

export function StoriesDrawer({
  visible,
  onClose,
  stories,
  loading,
  onSelectStory,
  onRefresh,
}: StoriesDrawerProps) {
  const translateY = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
  const { theme, isDark } = useTheme();
  const colors = isDark ? theme.colors.dark : theme.colors.light;
  const insets = useSafeAreaInsets();
  const { deleteStory } = useStoryPersistence();
  const { t } = useTranslation();

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : DRAWER_HEIGHT,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [visible, translateY]);

  const handleDeleteStory = (story: Story) => {
    Alert.alert(
      t('deleteStory'),
      t('deleteStoryConfirm', { title: story.title || t(story.seed) }),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStory(story.id);
              onRefresh();
            } catch (error) {
              console.error('Error deleting story:', error);
              Alert.alert(t('error'), t('deleteStoryError'));
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderStory = ({ item: story }: { item: Story }) => {
    const storyTheme =
      storyThemeMap[story.seed] === 'enchantedForest'
        ? enchantedForestTheme
        : retroFutureTheme;
    const storyColors = isDark
      ? storyTheme.colors.dark
      : storyTheme.colors.light;

    return (
      <View style={styles.storyCardWrapper}>
        <TouchableOpacity
          style={[
            styles.deleteButton,
            {
              backgroundColor: storyColors.accent || '#FF6B6B',
              borderColor: storyColors.border,
              borderWidth: storyTheme.styles.borderWidth,
              borderRadius: storyTheme.styles.borderRadius / 2,
            },
          ]}
          onPress={() => handleDeleteStory(story)}
        >
          <Ionicons name="trash-outline" size={16} color={isDark ? '#000' : '#fff'} />
        </TouchableOpacity>
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
          onPress={() => {
            onSelectStory(story.id, story.seed);
            onClose();
          }}
        >
          <View style={styles.storyCardContent}>
            <ThemedText
              style={[
                styles.storyTitle,
                {
                  fontFamily: storyTheme.fonts.button,
                  color: storyColors.text,
                },
              ]}
            >
              {story.title || t(story.seed)}
            </ThemedText>
            <ThemedText
              style={[
                styles.storyDate,
                {
                  fontFamily: storyTheme.fonts.body,
                  color: storyColors.text,
                  opacity: 0.7,
                },
              ]}
            >
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
      </View>
    );
  };

  if (!visible) return null;

  return (
    <>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <Animated.View
        style={[
          styles.drawer,
          {
            backgroundColor: colors.background,
            borderTopLeftRadius: theme.styles.borderRadius * 2,
            borderTopRightRadius: theme.styles.borderRadius * 2,
            borderWidth: theme.styles.borderWidth,
            borderBottomWidth: 0,
            borderColor: colors.border,
            transform: [{ translateY }],
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {/* Drawer handle */}
        <View style={styles.handle}>
          <View
            style={[
              styles.handleBar,
              {
                backgroundColor: colors.border,
              },
            ]}
          />
        </View>

        {/* Title */}
        <View style={styles.header}>
          <ThemedText
            type="subtitle"
            style={[
              styles.title,
              { fontFamily: theme.fonts.title, color: colors.text },
            ]}
          >
            {t('continueYourAdventures')}
          </ThemedText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Stories list */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.text}
            style={styles.loader}
          />
        ) : stories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText
              style={[
                styles.emptyText,
                { fontFamily: theme.fonts.body, color: colors.text, opacity: 0.6 },
              ]}
            >
              {t('noSavedStoriesYet')}
            </ThemedText>
            <TouchableOpacity
              style={[
                styles.refreshButton,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  borderRadius: theme.styles.borderRadius,
                  borderWidth: theme.styles.borderWidth,
                },
              ]}
              onPress={onRefresh}
            >
              <ThemedText
                style={[
                  styles.refreshButtonText,
                  { fontFamily: theme.fonts.button, color: colors.text },
                ]}
              >
                {t('refresh')}
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={stories}
            renderItem={renderStory}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: DRAWER_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  handle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
  },
  closeButton: {
    padding: 8,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 24,
  },
  storyCardWrapper: {
    marginBottom: 20,
    position: 'relative',
  },
  storyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  storyCardContent: {
    flex: 1,
    paddingLeft: 20,
  },
  deleteButton: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    elevation: 2,
  },
  storyTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  storyDate: {
    fontSize: 12,
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  refreshButtonText: {
    fontSize: 14,
  },
});