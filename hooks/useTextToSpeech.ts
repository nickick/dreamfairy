import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { ELEVENLABS_CONFIG } from '@/config/elevenlabs';

interface UseTextToSpeechReturn {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  speak: (text: string, voiceType?: 'narrator' | 'child' | 'fairy') => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  progress: number; // 0-1
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    // Configure audio session
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    // Cleanup
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const speak = async (text: string, voiceType: 'narrator' | 'child' | 'fairy' = 'narrator') => {
    try {
      setIsLoading(true);
      setError(null);

      if (!ELEVENLABS_CONFIG.API_KEY) {
        throw new Error('ElevenLabs API key not configured');
      }

      // Stop any existing playback
      await stop();

      // Make direct API call to ElevenLabs
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_CONFIG.VOICES[voiceType]}/stream`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_CONFIG.API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text,
            model_id: ELEVENLABS_CONFIG.MODEL_ID,
            voice_settings: ELEVENLABS_CONFIG.VOICE_SETTINGS,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail?.message || `API Error: ${response.status}`);
      }

      // Convert response to base64
      const arrayBuffer = await response.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );
      const audioUri = `data:audio/mpeg;base64,${base64}`;

      // Create and load sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setIsPlaying(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate speech');
      console.error('TTS Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setProgress(status.positionMillis / status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        setProgress(0);
      }
    }
  };

  const pause = async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    }
  };

  const resume = async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const stop = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
      setIsPlaying(false);
      setProgress(0);
    }
  };

  return {
    isLoading,
    isPlaying,
    error,
    speak,
    pause,
    resume,
    stop,
    progress,
  };
}