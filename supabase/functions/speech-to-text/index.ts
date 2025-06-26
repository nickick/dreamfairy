import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// @ts-ignore
import { OpenAI } from "https://deno.land/x/openai@v4.20.1/mod.ts";
import { requireAuth } from "../_shared/auth.ts";

// Deno types for TypeScript
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

interface RequestBody {
  audioData: string; // Base64 encoded audio
  storyContext?: string;
}

async function correctTranscriptWithContext(
  transcript: string,
  storyContext: string,
  openai: any
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that corrects speech-to-text transcriptions based on story context.
          Given the story context and a transcribed user choice, correct any misheard words to match the story's vocabulary and context.
          For example, if the story mentions "seed" and the transcription says "sea", correct it to "seed".
          Only make corrections that improve accuracy based on context. Keep the user's intent intact.
          Return ONLY the corrected text, nothing else.`,
        },
        {
          role: "user",
          content: `Story context: "${storyContext}"\n\nTranscribed user choice: "${transcript}"\n\nCorrected choice:`,
        },
      ],
      temperature: 0.3,
      max_tokens: 150,
    });

    return response.choices[0]?.message?.content?.trim() || transcript;
  } catch (err) {
    console.error("Error correcting transcript:", err);
    return transcript;
  }
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Verify authentication
    const user = await requireAuth(req);

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const { audioData, storyContext }: RequestBody = await req.json();

    if (!audioData) {
      return new Response(JSON.stringify({ error: "Audio data is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Convert base64 to Uint8Array
    const audioBytes = Uint8Array.from(atob(audioData), (c) => c.charCodeAt(0));

    // Create a File object from the audio bytes
    const audioFile = new File([audioBytes], "recording.m4a", {
      type: "audio/m4a",
    });

    // Transcribe using Whisper
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "en",
      prompt:
        "The user is describing what they want to happen next in a story.",
    });

    let finalTranscript = transcriptionResponse.text.trim();

    // If we have story context, use GPT to correct the transcript
    if (storyContext && finalTranscript) {
      finalTranscript = await correctTranscriptWithContext(
        finalTranscript,
        storyContext,
        openai
      );
    }

    return new Response(JSON.stringify({ transcript: finalTranscript }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in speech-to-text function:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to transcribe audio",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
