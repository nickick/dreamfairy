// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.1";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireAuth } from "../_shared/auth.ts";

// Deno types for TypeScript
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

interface RequestBody {
  text: string;
  voiceType?: "narrator" | "child" | "fairy";
}

const VOICES = {
  narrator: "EXAVITQu4vr4xnSDxMaL", // "Bella" - warm, friendly voice
  child: "jsCqWAovK2LkecY7zXl4", // "Freya" - young, energetic voice
  fairy: "ThT5KcBeYPX3keUQqHPh", // "Dorothy" - whimsical, magical voice
};

const VOICE_SETTINGS = {
  stability: 0.75,
  similarity_boost: 0.75,
  style: 0.5,
  use_speaker_boost: true,
};

// Create a hash of the text to use as a cache key
async function createTextHash(
  text: string,
  voiceType: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${text}_${voiceType}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex.substring(0, 16); // Use first 16 chars for shorter filenames
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Verify authentication
    const user = await requireAuth(req);

    const elevenLabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!elevenLabsApiKey) {
      throw new Error("ELEVENLABS_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const { text, voiceType = "narrator" }: RequestBody = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const voiceId = VOICES[voiceType];
    if (!voiceId) {
      return new Response(JSON.stringify({ error: "Invalid voice type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // List all buckets to debug
    const { data: allBuckets, error: bucketsError } =
      await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
    } else {
      // Check if audio bucket exists
      const audioBucketExists = allBuckets?.some((b: any) => b.id === "audio");
      if (!audioBucketExists) {
        // Try to create the bucket
        const { data: createData, error: createError } =
          await supabase.storage.createBucket("audio", {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: [
              "audio/mpeg",
              "audio/mp3",
              "audio/mp4",
              "audio/m4a",
            ],
          });

        if (createError) {
          console.error("Error creating audio bucket:", createError);
          throw new Error(
            `Could not create audio bucket: ${createError.message}`
          );
        }
      }
    }

    // Generate a unique filename based on text content and voice
    const textHash = await createTextHash(text, voiceType);
    const filename = `tts/${user.id}/${textHash}_${voiceType}.mp3`;

    // Check if audio already exists in storage
    const { data: existingFile, error: listError } = await supabase.storage
      .from("audio")
      .list(`tts/${user.id}`, {
        limit: 1,
        search: `${textHash}_${voiceType}.mp3`,
      });

    if (listError) {
      console.error("Error listing files:", listError);
      // Continue anyway - the file might not exist
    }

    if (existingFile && existingFile.length > 0) {
      // Return existing file URL
      const { data: urlData } = supabase.storage
        .from("audio")
        .getPublicUrl(filename);

      // Ensure we're using the correct public URL
      let publicUrl = urlData.publicUrl;

      if (publicUrl.includes("kong:8000")) {
        // Kong:8000 is the internal URL used by local Supabase
        publicUrl = publicUrl.replace(
          "http://kong:8000",
          "http://localhost:54321"
        );
      }

      return new Response(
        JSON.stringify({
          audioUrl: publicUrl,
          cached: true,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: "POST",
        headers: {
          "xi-api-key": elevenLabsApiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: VOICE_SETTINGS,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail?.message || `ElevenLabs API Error: ${response.status}`
      );
    }

    // Get the audio data as ArrayBuffer
    const audioBuffer = await response.arrayBuffer();

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("audio")
      .upload(filename, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      console.error("Error uploading to storage:", uploadError);
      throw new Error(`Failed to upload audio: ${uploadError.message}`);
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from("audio")
      .getPublicUrl(filename);

    // Ensure we're using the correct public URL
    let publicUrl = urlData.publicUrl;

    if (publicUrl.includes("kong:8000")) {
      // Kong:8000 is the internal URL used by local Supabase
      publicUrl = publicUrl.replace(
        "http://kong:8000",
        "http://localhost:54321"
      );
    }

    // Also return base64 for backward compatibility
    const base64Audio = btoa(
      new Uint8Array(audioBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );

    return new Response(
      JSON.stringify({
        audioUrl: publicUrl,
        audioData: base64Audio, // Include for backward compatibility
        stored: true,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in text-to-speech function:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to generate speech",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
