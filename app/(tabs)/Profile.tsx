import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, ScrollView, Modal, Platform } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { NetworkDiagnostics } from '@/components/NetworkDiagnostics';
import { useTranslation } from '@/constants/translations';
import { LanguageDropdown } from '@/components/LanguageDropdown';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { theme, isDark } = useTheme();
  const colors = isDark ? theme.colors.dark : theme.colors.light;
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [storyCount, setStoryCount] = useState(0);
  const [choiceCount, setChoiceCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get story count
        const { count: stories } = await supabase
          .from('stories')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get total choices made (count nodes with non-null choice_made)
        const { count: choices } = await supabase
          .from('story_nodes')
          .select('story_id', { count: 'exact', head: true })
          .eq('story_id', user.id)
          .not('choice_made', 'is', null);

        // For a more accurate count, we need to join through stories
        const { data: userStories } = await supabase
          .from('stories')
          .select('id')
          .eq('user_id', user.id);

        if (userStories && userStories.length > 0) {
          const storyIds = userStories.map(s => s.id);
          const { count: actualChoices } = await supabase
            .from('story_nodes')
            .select('*', { count: 'exact', head: true })
            .in('story_id', storyIds)
            .not('choice_made', 'is', null);

          setChoiceCount(actualChoices || 0);
        }

        setStoryCount(stories || 0);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const handleSignOut = () => {
    Alert.alert(
      t('signOut'),
      t('signOutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('signOut'), 
          style: 'destructive',
          onPress: signOut
        }
      ]
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerContainer}>
        <LanguageDropdown />
      </View>
      <ScrollView 
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[
          styles.profileCard,
          {
            backgroundColor: colors.primary,
            borderColor: colors.border,
            borderRadius: theme.styles.borderRadius,
            borderWidth: theme.styles.borderWidth,
            shadowColor: colors.border,
            shadowOffset: theme.styles.shadowOffset,
            shadowOpacity: theme.styles.shadowOpacity,
            shadowRadius: theme.styles.shadowRadius,
          }
        ]}>
          <View style={[
            styles.avatarContainer,
            {
              backgroundColor: colors.accent,
              borderColor: colors.border,
              borderRadius: 60,
              borderWidth: theme.styles.borderWidth,
            }
          ]}>
            <Ionicons 
              name="person" 
              size={48} 
              color={isDark ? '#000' : '#000'} 
            />
          </View>

          <ThemedText style={[
            styles.emailText,
            { 
              fontFamily: theme.fonts.body,
              color: colors.text
            }
          ]}>
            {user?.email || (user?.id ? t('guestUser') : 'No email')}
          </ThemedText>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <ThemedText style={[
                styles.statValue,
                { 
                  fontFamily: theme.fonts.title,
                  color: colors.accent
                }
              ]}>
                {loading ? '...' : storyCount}
              </ThemedText>
              <ThemedText style={[
                styles.statLabel,
                { 
                  fontFamily: theme.fonts.body,
                  color: colors.text,
                  opacity: 0.7
                }
              ]}>
                {t('stories')}
              </ThemedText>
            </View>

            <View style={[
              styles.statDivider,
              { backgroundColor: colors.border }
            ]} />

            <View style={styles.statItem}>
              <ThemedText style={[
                styles.statValue,
                { 
                  fontFamily: theme.fonts.title,
                  color: colors.accent
                }
              ]}>
                {loading ? '...' : choiceCount}
              </ThemedText>
              <ThemedText style={[
                styles.statLabel,
                { 
                  fontFamily: theme.fonts.body,
                  color: colors.text,
                  opacity: 0.7
                }
              ]}>
                {t('choices')}
              </ThemedText>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.signOutButton,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
              borderRadius: theme.styles.borderRadius,
              borderWidth: theme.styles.borderWidth,
            }
          ]}
          onPress={handleSignOut}
        >
          <Ionicons 
            name="log-out-outline" 
            size={20} 
            color={colors.text} 
            style={styles.signOutIcon}
          />
          <ThemedText style={[
            styles.signOutText,
            { 
              fontFamily: theme.fonts.button,
              color: colors.text
            }
          ]}>
            {t('signOut')}
          </ThemedText>
        </TouchableOpacity>

        {__DEV__ && (
          <TouchableOpacity
            style={[
              styles.debugButton,
              {
                backgroundColor: '#FF6B6B',
                borderColor: colors.border,
                borderRadius: theme.styles.borderRadius,
                borderWidth: theme.styles.borderWidth,
              }
            ]}
            onPress={() => setShowDiagnostics(true)}
          >
            <Ionicons 
              name="bug-outline" 
              size={20} 
              color="#FFF" 
              style={styles.signOutIcon}
            />
            <ThemedText style={[
              styles.debugText,
              { 
                fontFamily: theme.fonts.button,
                color: '#FFF'
              }
            ]}>
              {t('networkDiagnostics')}
            </ThemedText>
          </TouchableOpacity>
        )}

        <ThemedText style={[
          styles.versionText,
          { 
            fontFamily: theme.fonts.body,
            color: colors.text,
            opacity: 0.5
          }
        ]}>
          DreamFairy v1.0.0
        </ThemedText>
      </ScrollView>

      <Modal
        visible={showDiagnostics}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDiagnostics(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalHeader, { backgroundColor: colors.primary }]}>
            <ThemedText style={[styles.modalTitle, { fontFamily: theme.fonts.title, color: colors.text }]}>
              {t('networkDiagnostics')}
            </ThemedText>
            <TouchableOpacity onPress={() => setShowDiagnostics(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <NetworkDiagnostics />
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    zIndex: 1000,
  },
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
    minHeight: '100%',
  },
  profileCard: {
    width: '100%',
    maxWidth: 400,
    padding: 32,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emailText: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 2,
    height: 40,
    marginHorizontal: 24,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  signOutIcon: {
    marginRight: 8,
  },
  signOutText: {
    fontSize: 14,
  },
  versionText: {
    fontSize: 12,
    marginTop: 16,
    marginBottom: 40,
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 16,
  },
  debugText: {
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
