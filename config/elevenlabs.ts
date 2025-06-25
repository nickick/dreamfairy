export const ELEVENLABS_CONFIG = {
  // You'll need to add your API key here
  // Get one from https://elevenlabs.io/
  API_KEY: process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || '',
  
  // Voice IDs for different character types
  VOICES: {
    narrator: 'EXAVITQu4vr4xnSDxMaL', // "Bella" - warm, friendly voice
    child: 'jsCqWAovK2LkecY7zXl4', // "Freya" - young, energetic voice
    fairy: 'ThT5KcBeYPX3keUQqHPh', // "Dorothy" - whimsical, magical voice
  },
  
  // Voice settings for optimal storytelling
  VOICE_SETTINGS: {
    stability: 0.75,
    similarity_boost: 0.75,
    style: 0.5,
    use_speaker_boost: true,
  },
  
  // Model to use
  MODEL_ID: 'eleven_turbo_v2_5', // Fast and high quality
};