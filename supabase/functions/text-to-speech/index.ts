import "jsr:@supabase/functions-js/edge-runtime.d.ts"

interface RequestBody {
  text: string;
  voiceType?: 'narrator' | 'child' | 'fairy';
}

const VOICES = {
  narrator: 'EXAVITQu4vr4xnSDxMaL', // "Bella" - warm, friendly voice
  child: 'jsCqWAovK2LkecY7zXl4', // "Freya" - young, energetic voice
  fairy: 'ThT5KcBeYPX3keUQqHPh', // "Dorothy" - whimsical, magical voice
}

const VOICE_SETTINGS = {
  stability: 0.75,
  similarity_boost: 0.75,
  style: 0.5,
  use_speaker_boost: true,
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY')
    if (!elevenLabsApiKey) {
      throw new Error('ELEVENLABS_API_KEY not configured')
    }

    const { text, voiceType = 'narrator' }: RequestBody = await req.json()
    
    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const voiceId = VOICES[voiceType]
    if (!voiceId) {
      return new Response(
        JSON.stringify({ error: 'Invalid voice type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': elevenLabsApiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: VOICE_SETTINGS,
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail?.message || `ElevenLabs API Error: ${response.status}`)
    }

    // Get the audio data as ArrayBuffer
    const audioBuffer = await response.arrayBuffer()
    
    // Convert to base64
    const base64Audio = btoa(
      new Uint8Array(audioBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    )

    return new Response(
      JSON.stringify({
        audioData: base64Audio,
        audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in text-to-speech function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate speech' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})