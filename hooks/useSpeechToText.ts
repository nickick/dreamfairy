import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

interface UseSpeechToTextReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  transcript: string;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: (storyContext?: string) => Promise<void>;
  clearTranscript: () => void;
}

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

async function correctTranscriptWithContext(transcript: string, storyContext: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that corrects speech-to-text transcriptions based on story context. 
            Given the story context and a transcribed user choice, correct any misheard words to match the story's vocabulary and context.
            For example, if the story mentions "seed" and the transcription says "sea", correct it to "seed".
            Only make corrections that improve accuracy based on context. Keep the user's intent intact.
            Return ONLY the corrected text, nothing else.`
          },
          {
            role: 'user',
            content: `Story context: "${storyContext}"\n\nTranscribed user choice: "${transcript}"\n\nCorrected choice:`
          }
        ],
        temperature: 0.3,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      console.error('GPT correction failed:', response.status);
      return transcript; // Return original on error
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || transcript;
  } catch (err) {
    console.error('Error correcting transcript:', err);
    return transcript; // Return original on error
  }
}

export function useSpeechToText(): UseSpeechToTextReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = async () => {
    try {
      setError(null);
      
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Microphone permission not granted');
      }

      // Configure audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      console.error('Recording Error:', err);
    }
  };

  const stopRecording = async (storyContext?: string) => {
    if (!recordingRef.current) return;

    try {
      setIsRecording(false);
      setIsTranscribing(true);
      
      // Stop and unload recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        throw new Error('No recording URI available');
      }

      // Create form data
      const formData = new FormData();
      // @ts-ignore - React Native FormData accepts this format
      formData.append('file', {
        uri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      });
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');
      formData.append('prompt', 'The user is describing what they want to happen next in a story.');

      // Send to OpenAI Whisper API
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Transcription failed: ${response.status}`);
      }

      const data = await response.json();
      const rawTranscript = data.text.trim();
      
      // Clean up the audio file
      await FileSystem.deleteAsync(uri, { idempotent: true });
      
      // If we have story context, use GPT to correct the transcript
      if (storyContext && rawTranscript) {
        const correctedTranscript = await correctTranscriptWithContext(rawTranscript, storyContext);
        setTranscript(correctedTranscript);
      } else {
        setTranscript(rawTranscript);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transcribe audio');
      console.error('Transcription Error:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setError(null);
  };

  return {
    isRecording,
    isTranscribing,
    transcript,
    error,
    startRecording,
    stopRecording,
    clearTranscript,
  };
}