import React from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { theme, isDark } = useTheme();
  const colors = isDark ? theme.colors.dark : theme.colors.light;
  const insets = useSafeAreaInsets();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: signOut
        }
      ]
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
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
            {user?.email || (user?.id ? 'Guest User' : 'No email')}
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
                0
              </ThemedText>
              <ThemedText style={[
                styles.statLabel,
                { 
                  fontFamily: theme.fonts.body,
                  color: colors.text,
                  opacity: 0.7
                }
              ]}>
                Stories
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
                0
              </ThemedText>
              <ThemedText style={[
                styles.statLabel,
                { 
                  fontFamily: theme.fonts.body,
                  color: colors.text,
                  opacity: 0.7
                }
              ]}>
                Choices
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
            Sign Out
          </ThemedText>
        </TouchableOpacity>

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
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
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
    marginTop: 'auto',
    marginBottom: 20,
  },
});
