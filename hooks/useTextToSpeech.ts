import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { ELEVENLABS_CONFIG } from '@/config/elevenlabs';

interface UseTextToSpeechReturn {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  speak: (text: string, voiceType?: 'narrator' | 'child' | 'fairy', existingAudioUrl?: string) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  progress: number; // 0-1
  volume: number; // 0-1
  setVolume: (volume: number) => Promise<void>;
  getLastAudioUrl: () => string | null;
}

// Cache for storing generated audio data
interface AudioCacheEntry {
  audioUri: string;
  timestamp: number;
}

const audioCache = new Map<string, AudioCacheEntry>();
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [volume, setVolumeState] = useState(1.0);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const currentTextRef = useRef<string>('');
  const currentVoiceRef = useRef<string>('');
  const lastAudioUrlRef = useRef<string | null>(null);
  const isAudioConfigured = useRef(false);
  
  const setVolume = async (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    if (soundRef.current) {
      await soundRef.current.setVolumeAsync(clampedVolume);
    }
  };
  
  const getLastAudioUrl = () => lastAudioUrlRef.current;

  useEffect(() => {
    // Configure audio session for optimal playback
    const setupAudio = async () => {
      try {
        // First, ensure we have the proper category set
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
          interruptionModeIOS: 1, // DO_NOT_MIX
          interruptionModeAndroid: 1, // DO_NOT_MIX
          playThroughEarpieceAndroid: false,
          // Force audio to play through speaker
          allowsRecordingIOS: false,
        });
        
        isAudioConfigured.current = true;
      } catch (error) {
        console.error('Error setting audio mode:', error);
      }
    };
    
    setupAudio();

    // Cleanup
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Clean up expired cache entries
  const cleanupCache = () => {
    const now = Date.now();
    for (const [key, entry] of audioCache.entries()) {
      if (now - entry.timestamp > CACHE_EXPIRY_MS) {
        audioCache.delete(key);
      }
    }
  };

  const speak = async (text: string, voiceType: 'narrator' | 'child' | 'fairy' = 'narrator', existingAudioUrl?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Ensure audio is configured before playback
      if (!isAudioConfigured.current) {
        try {
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: false,
            interruptionModeIOS: 1, // DO_NOT_MIX
            interruptionModeAndroid: 1, // DO_NOT_MIX
            playThroughEarpieceAndroid: false,
            allowsRecordingIOS: false,
          });
          isAudioConfigured.current = true;
        } catch (error) {
          console.error('Error configuring audio in speak():', error);
        }
      }

      // Stop any existing playback
      await stop();

      // Store current text and voice for potential replay
      currentTextRef.current = text;
      currentVoiceRef.current = voiceType;

      let audioUri: string;

      // If we have an existing audio URL, use it directly
      if (existingAudioUrl) {
        audioUri = existingAudioUrl;
        lastAudioUrlRef.current = existingAudioUrl;
      } else {
        if (!ELEVENLABS_CONFIG.API_KEY) {
          throw new Error('ElevenLabs API key not configured');
        }

        // Create cache key
        const cacheKey = `${text}_${voiceType}`;
        
        // Clean up old cache entries
        cleanupCache();

        // Check cache first
        const cachedEntry = audioCache.get(cacheKey);

        if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_EXPIRY_MS) {
          // Use cached audio
          audioUri = cachedEntry.audioUri;
        } else {
        // Generate new audio
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
        audioUri = `data:audio/mpeg;base64,${base64}`;

          // Cache the audio
          audioCache.set(cacheKey, {
            audioUri,
            timestamp: Date.now(),
          });
          
          // Store the generated URL
          lastAudioUrlRef.current = audioUri;
        }
      }

      // Create and load sound with current volume
      const { sound, status } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { 
          shouldPlay: true,
          volume: 1.0, // Force max volume
          isMuted: false,
          isLooping: false,
          rate: 1.0,
          shouldCorrectPitch: true,
        },
        onPlaybackStatusUpdate
      );

      // Ensure volume is set to max
      await sound.setVolumeAsync(1.0);
      
      soundRef.current = sound;
      setIsPlaying(true);
      
      // Force play if not already playing
      if (status && 'isLoaded' in status && status.isLoaded && !status.isPlaying) {
        await sound.playAsync();
      }
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
    } else if (status.error) {
      console.error('Playback error:', status.error);
      setError(status.error);
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
    } else if (currentTextRef.current) {
      // If no sound is loaded but we have the text, replay it from cache
      await speak(currentTextRef.current, currentVoiceRef.current as any);
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
    volume,
    setVolume,
    getLastAudioUrl,
  };
}