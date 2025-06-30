# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dream Fairy is a React Native (Expo) application that creates AI-powered interactive storybooks for children. It features branching narratives, AI-generated illustrations, and voice narration in multiple languages.

## Quick Start

### Running the Development Environment

```bash
# Terminal 1: Start Supabase (requires Docker)
npx supabase start

# Terminal 2: Serve Edge Functions
npx supabase functions serve

# Terminal 3: Start Expo development server
npm start
# Then press 'i' for iOS or 'a' for Android
```

### Environment Setup

The project uses `.env.local` for environment configuration.

To run the development environment:
```bash
# Default (uses .env.local)
npm start

# Platform-specific commands
npm run ios
npm run android
```

Note: When testing with remote Supabase, manually update the values in `.env.local`.

### Testing

```bash
# Run all Edge Function tests
npm test

# Run specific test file
npx deno test supabase/functions/tests/generate-story.test.ts --env=supabase/functions/.env.test

# Run tests with coverage
npx deno test --coverage=coverage

# Lint check
npm run lint
```

## Architecture

### Tech Stack
- **Frontend**: React Native with Expo v53, TypeScript (strict mode)
- **Navigation**: Expo Router (file-based routing with typed navigation)
- **Backend**: Supabase (Database, Auth, Edge Functions, Storage)
- **AI Services**: 
  - OpenAI GPT-4 for story generation
  - GetImg.ai for illustrations
  - ElevenLabs for voice narration
- **Audio**: expo-audio for recording/playback (migrated from expo-av)

### Key Architectural Patterns

1. **Custom Hooks Pattern**: Business logic is encapsulated in hooks (`/hooks/`)
   - `useStory.ts`: Story generation and management
   - `useTextToSpeech.ts`: Voice narration with Supabase Storage
   - `useSpeechToText.ts`: Voice input processing
   - `useVideoAsset.ts`: Video background management

2. **Context Providers**: Global state management (`/contexts/`)
   - `AuthContext`: User authentication state
   - `ThemeContext`: Theme and appearance management
   - `VoiceContext`: Voice selection preferences

3. **Edge Functions**: Serverless API endpoints (`/supabase/functions/`)
   - `generate-story`: Creates story content with OpenAI
   - `generate-image`: Creates illustrations with AI
   - `text-to-speech`: Generates voice narration
   - `speech-to-text`: Processes voice input

4. **Database Schema**: PostgreSQL with RLS
   - `profiles`: User preferences and settings
   - `stories`: Story metadata and content
   - `story_assets`: Generated images and audio files
   - `story_nodes`: Individual story segments with choices

### File Structure Conventions

- **Routes**: File-based routing in `/app/` directory
- **Components**: Reusable UI components in `/components/`
- **Utilities**: Helper functions in `/lib/`
- **Types**: TypeScript definitions in `/types/`
- **Database Types**: Auto-generated in `/types/supabase.ts`

## Important Technical Details

### Audio System
- Uses expo-audio for all audio functionality
- Audio files stored in Supabase Storage (bucket: "audio")
- Handles local development URL rewrites (kong:8000 → localhost:54321)
- Implements caching for generated audio

### Multi-language Support
Languages supported: English (en), Tagalog (tl), Mandarin (zh), Cantonese (yue)
- Story generation adapts to selected language
- Voice narration uses language-specific voices
- UI remains in English (content is localized)

### Theme System
- Light/Dark mode with system preference detection
- Theme-aware video backgrounds
- Consistent color system across components

### Authentication Flow
- Email/password authentication via Supabase
- Protected routes using `_layout.tsx` guards
- User profiles created automatically on signup

## Common Development Tasks

### Adding a New Edge Function
1. Create function in `supabase/functions/[function-name]/index.ts`
2. Add types to `/lib/edgeFunctions.ts`
3. Create test file in `supabase/functions/tests/`
4. Add CORS headers following existing pattern

### Modifying Database Schema
1. Create migration: `npx supabase migration new [description]`
2. Update TypeScript types: `npm run generate-types`
3. Test locally before deploying

### Working with Audio
- Always check for `kong:8000` URLs and replace with `localhost:54321` in local dev
- Use the audio bucket for storing generated files
- Implement proper cleanup for temporary recordings

## Troubleshooting

### Common Issues
1. **"Bucket not found" error**: Run the audio storage bucket migration
2. **Audio not playing**: Check for kong:8000 URLs in local development
3. **Recording errors**: Ensure microphone permissions are granted
4. **Edge function timeouts**: Check API key validity and network connectivity

### Local Development URLs
- Supabase UI: http://localhost:54323
- API: http://localhost:54321
- Edge Functions: http://localhost:54321/functions/v1/

## Testing Guidelines

Edge Functions use Deno's built-in test runner with:
- Mock Supabase clients for database operations
- Environment variable injection via `.env.test`
- Comprehensive test coverage for all endpoints
- Tests should cover error cases and edge scenarios

## Recent Changes

- Migrated from expo-av to expo-audio for all audio functionality
- Implemented Supabase Storage for audio file hosting
- Added story node system for better narrative tracking
- Removed fade-to-black transitions from video backgrounds
- Fixed story history to include full context, not just choices