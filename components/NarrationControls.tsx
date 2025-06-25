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
}

export function NarrationControls({
  isLoading,
  isPlaying,
  progress,
  onPlay,
  onPause,
  onStop,
  error,
}: NarrationControlsProps) {
  const { theme, isDark } = useTheme();
  const colors = isDark ? theme.colors.dark : theme.colors.light;

  return (
    <View style={styles.container}>
      <View 
        style={[
          styles.controlsWrapper,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
            borderWidth: theme.styles.borderWidth,
            borderRadius: theme.styles.borderRadius,
            shadowColor: colors.border,
            shadowOffset: theme.styles.shadowOffset,
            shadowOpacity: theme.styles.shadowOpacity,
            shadowRadius: theme.styles.shadowRadius,
          }
        ]}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.text} />
            <ThemedText style={[styles.loadingText, { fontFamily: theme.fonts.body, color: colors.text }]}>
              Generating narration...
            </ThemedText>
          </View>
        ) : (
          <>
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
                size={24} 
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
                <Ionicons name="stop" size={24} color={colors.text} />
              </TouchableOpacity>
            )}
          </>
        )}
        
        {error && (
          <ThemedText style={[styles.errorText, { fontFamily: theme.fonts.body, color: colors.accent }]}>
            {error}
          </ThemedText>
        )}
      </View>
      
      {(isPlaying || progress > 0) && (
        <View style={styles.progressContainer}>
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
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    alignItems: 'center',
  },
  controlsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  button: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  errorText: {
    fontSize: 11,
    marginLeft: 8,
  },
  progressContainer: {
    width: '100%',
    marginTop: 8,
    paddingHorizontal: 12,
  },
  progressBar: {
    height: 4,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
});