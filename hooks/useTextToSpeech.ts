import { EdgeFunctions } from "@/lib/edgeFunctions";
import { AudioModule, createAudioPlayer } from "expo-audio";
import { useEffect, useRef, useState } from "react";

interface UseTextToSpeechReturn {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  speak: (
    text: string,
    voiceType?: "narrator" | "child" | "fairy",
    existingAudioUrl?: string
  ) => Promise<void>;
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

// Clear cache if we detect local development URLs
export function clearAudioCache() {
  audioCache.clear();
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [volume, setVolumeState] = useState(1.0);

  const soundRef = useRef<any>(null);
  const currentTextRef = useRef<string>("");
  const currentVoiceRef = useRef<string>("");
  const lastAudioUrlRef = useRef<string | null>(null);
  const isAudioConfigured = useRef(false);

  const setVolume = async (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    if (soundRef.current && soundRef.current.setVolumeAsync) {
      await soundRef.current.setVolumeAsync(clampedVolume);
    }
  };

  const getLastAudioUrl = () => lastAudioUrlRef.current;

  useEffect(() => {
    // Configure audio session for optimal playback
    const setupAudio = async () => {
      try {
        // Configure audio for playback (not recording)
        await AudioModule.setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
        });

        isAudioConfigured.current = true;
      } catch (error) {
        console.error("Error setting audio mode:", error);
      }
    };

    setupAudio();

    // Cleanup
    return () => {
      if (soundRef.current) {
        if (soundRef.current.interval) {
          clearInterval(soundRef.current.interval);
        }
        if (soundRef.current.player && soundRef.current.player.release) {
          soundRef.current.player.release();
        }
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

  const speak = async (
    text: string,
    voiceType: "narrator" | "child" | "fairy" = "narrator",
    existingAudioUrl?: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      // Always reconfigure audio for playback to ensure clean state
      try {
        await AudioModule.setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
        });
        isAudioConfigured.current = true;

        // Small delay to ensure audio session is properly configured
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error("Error configuring audio in speak():", error);
      }

      // Stop any existing playback
      await stop();

      // Store current text
      currentTextRef.current = text;
      currentVoiceRef.current = voiceType;

      let audioUri: string;

      // If we have an existing audio URL, check if it's valid
      if (existingAudioUrl) {
        // Check if existing URL contains kong:8000
        if (existingAudioUrl.includes('kong:8000')) {
          existingAudioUrl = undefined;
        } else {
          audioUri = existingAudioUrl;
          lastAudioUrlRef.current = existingAudioUrl;
        }
      }
      
      if (!existingAudioUrl) {
        // Create cache key
        const cacheKey = `${text}_${voiceType}`;

        // Clean up old cache entries
        cleanupCache();

        // Check cache first
        let cachedEntry = audioCache.get(cacheKey);

        if (
          cachedEntry &&
          Date.now() - cachedEntry.timestamp < CACHE_EXPIRY_MS
        ) {
          // Check if cached URL is invalid (kong:8000)
          if (cachedEntry.audioUri.includes('kong:8000')) {
            audioCache.delete(cacheKey);
            cachedEntry = undefined;
          } else {
            // Use cached audio
            audioUri = cachedEntry.audioUri;
          }
        }
        
        // If cache was invalidated or didn't exist, generate new audio
        if (!cachedEntry || !audioUri) {
          // Generate new audio using Supabase edge function
          const response = await EdgeFunctions.textToSpeech({
            text,
            voiceType,
          });

          // Handle the response from the edge function
          if (response.audioUrl) {
            // Use the Supabase Storage URL directly
            audioUri = response.audioUrl;
          } else if (response.audioData) {
            // Fallback to data URL if only base64 is available
            audioUri = `data:audio/mpeg;base64,${response.audioData}`;
          } else {
            throw new Error("No audio data received from text-to-speech API");
          }

          // Cache the audio
          audioCache.set(cacheKey, {
            audioUri,
            timestamp: Date.now(),
          });

          // Store the generated URL
          lastAudioUrlRef.current = audioUri;
        }
      }

      // Create audio player

      if (!audioUri || audioUri.length === 0) {
        throw new Error("Invalid audio URI provided");
      }

      const sound = await createAudioPlayer(audioUri);

      // Validate the sound object
      if (!sound || typeof sound.play !== "function") {
        throw new Error("Failed to create valid audio player");
      }

      // Set up playback monitoring
      const checkPlayback = setInterval(async () => {
        if (sound && sound.playing !== undefined) {
          setIsPlaying(sound.playing);
          if (sound.duration > 0) {
            setProgress(sound.currentTime / sound.duration);
          }
        }
      }, 100);

      soundRef.current = { player: sound, interval: checkPlayback };

      // Start playing
      await sound.play();
      setIsPlaying(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate speech"
      );
      console.error("TTS Error:", err);
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
      console.error("Playback error:", status.error);
      setError(status.error);
    }
  };

  const pause = async () => {
    if (soundRef.current && soundRef.current.player) {
      await soundRef.current.player.pause();
      setIsPlaying(false);
    }
  };

  const resume = async () => {
    if (soundRef.current && soundRef.current.player) {
      await soundRef.current.player.play();
      setIsPlaying(true);
    } else if (currentTextRef.current) {
      // If no sound is loaded but we have the text, replay it from cache
      await speak(currentTextRef.current, currentVoiceRef.current as any);
    }
  };

  const stop = async () => {
    if (soundRef.current) {
      if (soundRef.current.interval) {
        clearInterval(soundRef.current.interval);
      }
      if (soundRef.current.player) {
        await soundRef.current.player.pause();
        soundRef.current.player.release();
      }
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
