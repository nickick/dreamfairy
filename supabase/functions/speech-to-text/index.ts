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
  language?: "en" | "tl" | "zh" | "yue"; // en=English, tl=Tagalog, zh=Mandarin, yue=Cantonese
}

// Language code mapping for Whisper API
const LANGUAGE_CODES: Record<string, string> = {
  en: "en", // English
  tl: "tl", // Tagalog/Filipino
  zh: "zh", // Mandarin Chinese
  yue: "zh", // Cantonese (Whisper doesn't have specific Cantonese, use Chinese)
};

async function correctTranscriptWithContext(
  transcript: string,
  storyContext: string,
  language: string,
  openai: any
): Promise<string> {
  try {
    const languageNames: Record<string, string> = {
      en: "English",
      tl: "Tagalog",
      zh: "Mandarin Chinese",
      yue: "Cantonese",
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that corrects speech-to-text transcriptions based on story context.
          The user spoke in ${languageNames[language] || "English"}.
          Given the story context and a transcribed user choice, correct any misheard words to match the story's vocabulary and context.
          For example, if the story mentions "seed" and the transcription says "sea", correct it to "seed".
          Only make corrections that improve accuracy based on context. Keep the user's intent intact.
          Preserve the original language of the transcript.
          Return ONLY the corrected text, nothing else.`,
        },
        {
          role: "user",
          content: `Story context: "${storyContext}"\n\nTranscribed user choice in ${
            languageNames[language] || "English"
          }: "${transcript}"\n\nCorrected choice:`,
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

    const {
      audioData,
      storyContext,
      language = "en",
    }: RequestBody = await req.json();

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
    let audioBytes: Uint8Array;
    try {
      audioBytes = Uint8Array.from(atob(audioData), (c) => c.charCodeAt(0));
      console.log(`Audio data size: ${audioBytes.length} bytes`);
    } catch (err) {
      console.error("Error decoding base64 audio data:", err);
      throw new Error("Invalid base64 audio data");
    }

    // Try to detect audio format from the first few bytes
    let mimeType = "audio/m4a";
    let extension = "m4a";

    // Check for common audio file signatures
    if (audioBytes.length > 8) {
      const header = Array.from(audioBytes.slice(0, 8))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      console.log(`Audio file header: ${header}`);

      if (header.startsWith("fff") || header.startsWith("494433")) {
        // MP3 format
        mimeType = "audio/mp3";
        extension = "mp3";
      } else if (header.startsWith("4f676753")) {
        // OGG format
        mimeType = "audio/ogg";
        extension = "ogg";
      } else if (header.startsWith("52494646")) {
        // WAV format
        mimeType = "audio/wav";
        extension = "wav";
      } else if (header.slice(8, 16) === "66747970") {
        // M4A/MP4 format (checks for 'ftyp' at offset 4)
        mimeType = "audio/m4a";
        extension = "m4a";
      }
    }

    console.log(`Detected audio format: ${mimeType} (${extension})`);

    // Create a File object from the audio bytes
    const audioFile = new File([audioBytes], `recording.${extension}`, {
      type: mimeType,
    });

    // Get the appropriate language code for Whisper
    const whisperLanguage = LANGUAGE_CODES[language] || "en";

    // Create language-specific prompts
    const languagePrompts: Record<string, string> = {
      en: "The user is describing what they want to happen next in a story.",
      tl: "Ang user ay naglalarawan kung ano ang gusto niyang mangyari sa susunod sa kuwento.",
      zh: "用户正在描述他们希望故事接下来发生什么。",
      yue: "用戶正在描述佢哋希望故事接下來發生咩。",
    };

    // Transcribe using Whisper
    let transcriptionResponse;
    try {
      transcriptionResponse = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: whisperLanguage,
        prompt: languagePrompts[language] || languagePrompts.en,
      });
    } catch (transcriptionError: any) {
      console.error("Whisper transcription error:", transcriptionError);
      console.error("Error details:", transcriptionError.error);
      console.error("Audio file size:", audioFile.size);
      console.error("Audio file type:", audioFile.type);

      // Try without language specification as a fallback
      try {
        console.log("Retrying without language specification...");
        transcriptionResponse = await openai.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-1",
        });
      } catch (retryError) {
        console.error("Retry failed:", retryError);
        throw new Error(
          `Transcription failed: ${
            transcriptionError.message || "Unknown error"
          }`
        );
      }
    }

    let finalTranscript = transcriptionResponse.text.trim();

    // If we have story context, use GPT to correct the transcript
    if (storyContext && finalTranscript) {
      finalTranscript = await correctTranscriptWithContext(
        finalTranscript,
        storyContext,
        language,
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
