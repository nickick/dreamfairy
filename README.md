# Dream Fairy 🧚‍♀️

An interactive AI-powered storybook app built with React Native (Expo) that creates personalized, branching story adventures for children. Dream Fairy combines the magic of storytelling with cutting-edge AI to generate unique narratives, illustrations, and narration.

## 📖 Project Description

Dream Fairy is a mobile application that transforms bedtime stories into interactive adventures. Using AI technology, it generates dynamic story content based on user choices, creates beautiful illustrations for each scene, and provides voice narration to bring stories to life. The app features a unique Magic currency system (planned) that will enable users to unlock new story branches and participate in fun mini-games.

## 🎯 Features

### Core Features

#### ✅ Story Generation
- **AI-powered story creation** using OpenAI GPT-3.5-turbo
- **Branching narrative system** with 2-4 choices per story node
- **Story seed selection** from predefined adventure themes
- **Real-time story generation** based on user choices
- **Story history tracking** to maintain narrative continuity

#### ✅ Visual Experience
- **AI-generated illustrations** for each story segment using GetImg.ai
- **Dynamic theme switching** based on story type (Retro Future & Enchanted Forest themes)
- **Custom fonts** for immersive storytelling experience
- **Dark mode support** with theme-aware color schemes
- **Smooth animations** and transitions between story nodes

#### ✅ Audio Narration
- **Text-to-speech narration** using ElevenLabs API
- **Multiple voice options** (narrator, child, fairy)
- **Playback controls** (play, pause, stop)
- **Progress tracking** for audio playback
- **Auto-narration** of new story content

#### ✅ User Interface
- **Tab-based navigation** system
- **Responsive design** for various screen sizes
- **Custom themed components** (ThemedText, ThemedView)
- **Retro-styled UI elements** with customizable borders and shadows
- **Gradient effects** and visual polish

### 🚧 In-Progress Features

#### Magic Currency System
- User magic balance tracking
- Story branch cost system
- Magic earning through mini-games
- Transaction history

### 📋 Planned Features

#### Fairy Tap Mini-Game
- Interactive fairy dust collection game
- Time-limited gameplay sessions
- Magic currency rewards
- Tap tracking and animations


#### Subscription System
- Free tier: 50 Magic/month
- Starter tier: 200 Magic/month
- Unlimited tier: Unlimited Magic + premium voices

#### Advanced Story Features
- Video generation for story nodes
- Story sharing capabilities
- Custom story creation
- Story bookmarking

#### Social Features
- Share stories with friends
- Collaborative storytelling
- Story ratings and favorites

## 🛠️ Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Hooks & Context API
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **Styling**: StyleSheet with theme system
- **AI Integration**:
  - OpenAI API (story generation)
  - GetImg.ai API (image generation)
  - ElevenLabs API (voice synthesis)
- **Audio**: expo-av
- **UI Components**: 
  - expo-blur
  - expo-linear-gradient
  - react-native-gesture-handler
  - react-native-reanimated
- **Testing**: Deno test runner for Edge Functions

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator
- Docker Desktop (for running Supabase locally)
- Deno (for running Edge Function tests)

### Quick Start

For a quick development setup, run these commands in separate terminals:

```bash
# Terminal 1: Start Supabase
npm run supabase:start

# Terminal 2: Start Edge Functions
npm run supabase:functions

# Terminal 3: Start Expo
npm start
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/nickick/dreamfairy.git
cd dreamfairy
```

2. Install dependencies:
```bash
npm install
```

3. Create environment files:

   a. Create `.env.local` in the root directory for the React Native app:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
   ```

   b. Create `supabase/.env.local` for Edge Functions:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   GETIMG_API_KEY=your_getimg_api_key_here
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   ```

4. Start Supabase locally:
```bash
npm run supabase:start
```

5. Run Edge Functions (in a new terminal):
```bash
npm run supabase:functions
```

6. Start the Expo development server (in a new terminal):
```bash
npm start
```

7. Run on your preferred platform:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device

### Environment Variables

The following API keys are required for Edge Functions:

- **OPENAI_API_KEY**: For story generation (get from [OpenAI Platform](https://platform.openai.com))
- **GETIMG_API_KEY**: For image generation (get from [GetImg.ai](https://getimg.ai))
- **ELEVENLABS_API_KEY**: For voice synthesis (get from [ElevenLabs](https://elevenlabs.io))

For the React Native app:

- **EXPO_PUBLIC_SUPABASE_URL**: Your Supabase project URL (use `http://localhost:54321` for local development)
- **EXPO_PUBLIC_SUPABASE_ANON_KEY**: Your Supabase anonymous key (find in Supabase dashboard or local output)

### Running Tests

To run the Edge Function tests:

```bash
npm run test:functions
```

This will execute all tests using Deno, validating:
- Authentication requirements for all Edge Functions
- Input parameter validation
- Response structure validation
- 21 tests total covering all Edge Functions

## 🔧 Supabase Edge Functions

The app uses Supabase Edge Functions to securely handle AI API calls. All functions require authentication.

### Available Endpoints

1. **Generate Story** (`/functions/v1/generate-story`)
   - Creates story content based on seed and history
   - Request: `{ seed: string, history: string[] }`
   - Response: `{ story: string, choices: string[] }`

2. **Generate Image** (`/functions/v1/generate-image`)
   - Creates illustrations for story nodes
   - Request: `{ prompt: string, width?: number, height?: number }`
   - Response: `{ imageUrl: string }`

3. **Text to Speech** (`/functions/v1/text-to-speech`)
   - Converts story text to audio narration
   - Request: `{ text: string, voiceType?: "narrator" | "child" | "fairy" }`
   - Response: `{ audioData: string, audioUrl: string }`

4. **Speech to Text** (`/functions/v1/speech-to-text`)
   - Transcribes user voice input
   - Request: `{ audioData: string, storyContext?: string }`
   - Response: `{ transcript: string }`

### Testing Edge Functions

Run the automated test suite:
```bash
npm run test:functions
```

Test functions manually with curl (replace YOUR_ANON_KEY):
```bash
# Test story generation
curl -X POST http://localhost:54321/functions/v1/generate-story \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"seed": "A magical garden"}'
```

## 📈 Current Progress

### Completed ✅
- Basic app structure and navigation
- Story generation with OpenAI integration
- Image generation for story nodes
- Voice narration with ElevenLabs
- Theme system with multiple story themes
- Dark mode support
- Story choice selection and branching
- Auto-scrolling to latest content
- Custom fonts and styling
- Supabase backend integration
- Database schema for users, stories, and transactions
- Edge Functions for AI services (story, image, speech)
- Authentication system with secure API access
- Story persistence in database (cloud storage)
- Automated test suite for Edge Functions
- Local development environment with Docker
- User authentication and profiles
- Voice input for story choices (speech-to-text integration)

### In Development 🚧
- Magic currency system backend
- Mini-game implementation

### Upcoming 📋
- Multi-language support for voice input
- Subscription tiers
- Video generation
- Social features
- Parental controls

## 📱 App Structure

```
app/
├── (tabs)/          # Tab navigation screens
│   ├── index.tsx    # Home/Story selection
│   ├── MiniGame.tsx # Fairy tap game (planned)
│   ├── Magic.tsx    # Currency dashboard (planned)
│   └── Profile.tsx  # User profile (planned)
├── Story.tsx        # Main story experience
└── _layout.tsx      # App layout configuration

components/
├── NarrationControls.tsx  # Audio playback UI
├── ThemedText.tsx        # Theme-aware text
├── ThemedView.tsx        # Theme-aware container
└── ui/                   # Platform-specific UI components

hooks/
├── useGenerateStory.ts   # Story generation logic
├── useGenerateImage.ts   # Image generation logic
└── useTextToSpeech.ts    # Voice synthesis logic

constants/
├── Colors.ts            # Color definitions
└── Themes.ts           # Theme configurations

supabase/
├── functions/           # Edge Functions
│   ├── _shared/        # Shared utilities
│   │   └── auth.ts     # Authentication helper
│   ├── generate-story/ # Story generation endpoint
│   ├── generate-image/ # Image generation endpoint
│   ├── speech-to-text/ # Audio transcription endpoint
│   ├── text-to-speech/ # Voice synthesis endpoint
│   └── tests/          # Test suite
│       ├── auth.test.ts
│       ├── generate-story.test.ts
│       ├── generate-image.test.ts
│       ├── speech-to-text.test.ts
│       └── text-to-speech.test.ts
├── migrations/         # Database schema
└── config.toml        # Supabase configuration
```

## 🤝 Contributing

This project is currently in active development. Contributions, bug reports, and feature requests are welcome!

## 📄 License

[License information to be added]

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev)
- Powered by [OpenAI](https://openai.com), [GetImg.ai](https://getimg.ai), and [ElevenLabs](https://elevenlabs.io)
- Custom fonts from Google Fonts