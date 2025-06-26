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
  prompt: string;
  width?: number;
  height?: number;
}

const GETIMG_API_URL = "https://api.getimg.ai/v1/flux-schnell/text-to-image";

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Verify authentication
    const user = await requireAuth(req);

    const getimgApiKey = Deno.env.get("GETIMG_API_KEY");
    if (!getimgApiKey) {
      throw new Error("GETIMG_API_KEY not configured");
    }

    const { prompt, width = 512, height = 512 }: RequestBody = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Call GetImg.ai API
    const response = await fetch(GETIMG_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getimgApiKey}`,
      },
      body: JSON.stringify({
        prompt,
        steps: 4,
        width,
        height,
        response_format: "url",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("GetImg API error:", errorData);
      throw new Error(
        errorData.error?.message || `GetImg API Error: ${response.status}`
      );
    }

    const data = await response.json();
    const imageUrl =
      data.image_url || data.url || data.images?.[0]?.url || null;

    if (!imageUrl) {
      throw new Error("No image URL returned from API");
    }

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in generate-image function:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to generate image",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
