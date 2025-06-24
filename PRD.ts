/**
 * Dream Fairy — PRD v1
 *
 * An interactive AI-powered storybook app built with React Native (Expo),
 * featuring branching story generation, narration, and a mini-game currency system.
 */

/* -------------------- ENTITIES -------------------- */

type User = {
  id: string;
  email: string;
  profileName: string;
  createdAt: string;
  magicBalance: number;
  subscriptionTier: "free" | "starter" | "unlimited";
  voicePreferences: {
    voiceType: string;
    language: string;
  };
};

type StoryNode = {
  id: string;
  userId: string;
  parentId: string | null;
  text: string;
  imageUrl: string;
  videoUrl?: string;
  narrationAudioUrl: string;
  choices: string[];
  createdAt: string;
  magicCost: number;
};

type MagicTransaction = {
  id: string;
  userId: string;
  amount: number;
  type: "earn" | "spend" | "bonus" | "monthly";
  source: "mini_game" | "story_branch" | "subscription" | "admin";
  timestamp: string;
};

type FairyTapGameSession = {
  id: string;
  userId: string;
  startTime: string;
  endTime: string;
  magicEarned: number;
  taps: {
    x: number;
    y: number;
    timestamp: string;
  }[];
};

/* -------------------- FUNCTIONAL OVERVIEW -------------------- */

// Story Generation
// - AI generates StoryNode (text → image → voice → optional video)
// - Branching costs Magic
// - Choices shown as buttons or selected via voice input

// Fairy Mini-Game
// - A fairy floats across screen, user taps to drop fairy dust
// - Each tap generates 1–3 Magic
// - Sessions time-limited (e.g., 60 seconds)
// - FairyTapGameSession records magicEarned + tap coords

// Magic Currency System
// - Tracked per user
// - Required for all AI branch generations
// - Earned via mini-game or monthly subscription tier

// Narration & Voice Input
// - Narration is generated per StoryNode
// - Users can speak to choose next direction
// - Uses Whisper or similar transcription API

// Subscription System
// - Free: 50 Magic/month, slow queue
// - Starter: 200 Magic/month, faster queue
// - Unlimited: Unlimited Magic, premium voices

/* -------------------- AI JOB PIPELINE -------------------- */

// Job steps triggered in order:
// 1. Generate story text
// 2. Generate stylized image (Ghibli, fantasy, etc.)
// 3. Generate narration audio
// 4. Optional: Generate video

// Each job consumes `magicCost` from user's balance

/* -------------------- TECHNICAL NOTES -------------------- */

// Stack: React Native (Expo), TypeScript
// Audio: expo-av, expo-speech (or native bridge)
// State: AsyncStorage + Supabase or Firebase
// Latency Goal: <5s per node branch
