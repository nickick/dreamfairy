import React from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface NarrationControlsProps {
  isLoading: boolean;
  isPlaying: boolean;
  progress: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  error?: string | null;
  currentStoryText?: string;
}

export function NarrationControls({
  isLoading,
  isPlaying,
  progress,
  onPlay,
  onPause,
  onStop,
  error,
  currentStoryText,
}: NarrationControlsProps) {
  const { theme, isDark } = useTheme();
  const colors = isDark ? theme.colors.dark : theme.colors.light;

  return (
    <View style={styles.container}>
      {(isPlaying || progress > 0) && (
        <View style={styles.progressWrapper}>
          <View 
            style={[
              styles.progressBar,
              {
                backgroundColor: colors.border,
                borderRadius: theme.styles.borderRadius / 2,
              }
            ]}
          >
            <View 
              style={[
                styles.progressFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: colors.accent,
                  borderRadius: theme.styles.borderRadius / 2,
                }
              ]}
            />
          </View>
          <View style={styles.controlsWrapper}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.text} />
                <ThemedText style={[styles.loadingText, { fontFamily: theme.fonts.body, color: colors.text }]}>
                  Loading...
                </ThemedText>
              </View>
            ) : (
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  onPress={isPlaying ? onPause : onPlay}
                  style={[
                    styles.button,
                    {
                      backgroundColor: colors.accent,
                      borderColor: colors.border,
                      borderWidth: theme.styles.borderWidth,
                      borderRadius: theme.styles.borderRadius,
                    }
                  ]}
                >
                  <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={16} 
                    color={isDark ? '#000' : '#000'} 
                  />
                </TouchableOpacity>
                
                {isPlaying && (
                  <TouchableOpacity
                    onPress={onStop}
                    style={[
                      styles.button,
                      {
                        backgroundColor: colors.secondary,
                        borderColor: colors.border,
                        borderWidth: theme.styles.borderWidth,
                        borderRadius: theme.styles.borderRadius,
                      }
                    ]}
                  >
                    <Ionicons name="stop" size={16} color={colors.text} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      )}
      
      {!isPlaying && progress === 0 && (
        <View style={styles.standaloneControls}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.text} />
              <ThemedText style={[styles.loadingText, { fontFamily: theme.fonts.body, color: colors.text }]}>
                Generating narration...
              </ThemedText>
            </View>
          ) : (
            <>
              {currentStoryText ? (
                <ThemedText 
                  style={[
                    styles.textPreview, 
                    { 
                      fontFamily: theme.fonts.body, 
                      color: colors.text,
                      opacity: 0.7 
                    }
                  ]}
                  numberOfLines={1}
                >
                  {currentStoryText.slice(0, 60)}...
                </ThemedText>
              ) : (
                <View style={{ flex: 1 }} />
              )}
              <TouchableOpacity
                onPress={onPlay}
                style={[
                  styles.button,
                  {
                    backgroundColor: currentStoryText ? colors.accent : colors.secondary,
                    borderColor: colors.border,
                    borderWidth: theme.styles.borderWidth,
                    borderRadius: theme.styles.borderRadius,
                    opacity: currentStoryText ? 1 : 0.5,
                  }
                ]}
                disabled={!currentStoryText}
              >
                <Ionicons 
                  name="play" 
                  size={16} 
                  color={currentStoryText ? (isDark ? '#000' : '#000') : colors.text} 
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
      
      {error && (
        <ThemedText style={[styles.errorText, { fontFamily: theme.fonts.body, color: colors.accent }]}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  progressWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  progressBar: {
    height: 4,
    flex: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  controlsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  button: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  standaloneControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
  },
  textPreview: {
    fontSize: 12,
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loadingText: {
    fontSize: 11,
  },
  errorText: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
});