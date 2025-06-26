# Supabase Edge Functions for DreamFairy

This directory contains Supabase Edge Functions that handle AI/LLM API calls for the DreamFairy app.

## Functions

1. **generate-story**: Generates story content using OpenAI GPT-3.5
2. **speech-to-text**: Converts speech to text using OpenAI Whisper
3. **text-to-speech**: Converts text to speech using ElevenLabs
4. **generate-image**: Generates images using GetImg.ai

## Setup

### 1. Configure Environment Variables

Copy the example environment file and add your API keys:

```bash
cd supabase
cp .env.local.example .env.local
```

Edit `.env.local` and add your API keys:
- `OPENAI_API_KEY`: Your OpenAI API key
- `ELEVENLABS_API_KEY`: Your ElevenLabs API key
- `GETIMG_API_KEY`: Your GetImg.ai API key

### 2. Deploy Functions

Deploy all functions to your Supabase project:

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individual functions
supabase functions deploy generate-story
supabase functions deploy speech-to-text
supabase functions deploy text-to-speech
supabase functions deploy generate-image
```

### 3. Set Secrets

Set the API keys as secrets in your Supabase project:

```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
supabase secrets set ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
supabase secrets set GETIMG_API_KEY=your_getimg_api_key_here
```

## Development

To run functions locally:

```bash
supabase start
supabase functions serve
```

## Testing

Test functions locally:

```bash
# Test story generation
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-story' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"seed":"A magical forest","history":[]}'

# Test other functions similarly...
```

## Benefits

By using Supabase Edge Functions:
- API keys are securely stored on the server
- Reduced client-side bundle size
- Better control over API usage and rate limiting
- Easier to update API integrations without app updates
- Enhanced security by keeping sensitive operations server-side