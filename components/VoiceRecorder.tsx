import React, { useEffect } from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useSpeechToText } from '@/hooks/useSpeechToText';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  storyContext?: string;
}

export function VoiceRecorder({ onTranscript, disabled, storyContext }: VoiceRecorderProps) {
  const { theme, isDark } = useTheme();
  const colors = isDark ? theme.colors.dark : theme.colors.light;
  const { 
    isRecording, 
    isTranscribing, 
    transcript, 
    error, 
    startRecording, 
    stopRecording,
    clearTranscript 
  } = useSpeechToText();

  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
      clearTranscript();
    }
  }, [transcript, onTranscript, clearTranscript]);

  const handlePress = () => {
    if (isRecording) {
      stopRecording(storyContext);
    } else {
      startRecording();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || isTranscribing}
        style={[
          styles.button,
          {
            backgroundColor: isRecording ? colors.accent : colors.secondary,
            borderColor: colors.border,
            borderWidth: theme.styles.borderWidth,
            borderRadius: theme.styles.borderRadius,
            shadowColor: colors.border,
            shadowOffset: theme.styles.shadowOffset,
            shadowOpacity: theme.styles.shadowOpacity,
            shadowRadius: theme.styles.shadowRadius,
          },
          (disabled || isTranscribing) && styles.buttonDisabled,
        ]}
      >
        {isTranscribing ? (
          <ActivityIndicator size="small" color={isDark ? '#000' : '#000'} />
        ) : (
          <Ionicons 
            name={isRecording ? "stop" : "mic"} 
            size={24} 
            color={isDark ? '#000' : '#000'} 
          />
        )}
      </TouchableOpacity>
      
      {isRecording && (
        <ThemedText style={[styles.recordingText, { fontFamily: theme.fonts.body, color: colors.accent }]}>
          Recording...
        </ThemedText>
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
    alignItems: 'center',
    marginVertical: 12,
  },
  button: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  recordingText: {
    fontSize: 12,
    marginTop: 8,
  },
  errorText: {
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 200,
  },
});