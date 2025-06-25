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

#### Voice Input
- Voice-based story choice selection
- Speech-to-text integration
- Multi-language support

### 📋 Planned Features

#### Fairy Tap Mini-Game
- Interactive fairy dust collection game
- Time-limited gameplay sessions
- Magic currency rewards
- Tap tracking and animations

#### User Profiles & Authentication
- User account creation
- Profile customization
- Story library/history
- Progress saving

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

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd dreamfairy
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with your API keys:
```env
OPENAI_API_KEY=your_openai_api_key_here
GETIMG_API_KEY=your_getimg_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

4. Start the development server:
```bash
npx expo start
```

5. Run on your preferred platform:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device

### Environment Variables

The following API keys are required:

- **OPENAI_API_KEY**: For story generation (get from [OpenAI Platform](https://platform.openai.com))
- **GETIMG_API_KEY**: For image generation (get from [GetImg.ai](https://getimg.ai))
- **ELEVENLABS_API_KEY**: For voice synthesis (get from [ElevenLabs](https://elevenlabs.io))

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

### In Development 🚧
- Magic currency system backend
- User authentication
- Mini-game implementation
- Voice input for story choices

### Upcoming 📋
- Cloud storage for stories
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
```

## 🤝 Contributing

This project is currently in active development. Contributions, bug reports, and feature requests are welcome!

## 📄 License

[License information to be added]

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev)
- Powered by [OpenAI](https://openai.com), [GetImg.ai](https://getimg.ai), and [ElevenLabs](https://elevenlabs.io)
- Custom fonts from Google Fonts