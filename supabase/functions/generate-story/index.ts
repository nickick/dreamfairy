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

interface StoryNode {
  story: string;
  choices: string[];
}

interface RequestBody {
  seed: string;
  history: string[];
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

    const { seed, history = [] }: RequestBody = await req.json();

    if (!seed) {
      return new Response(JSON.stringify({ error: "Seed is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            'You are a magical storybook AI for children. Write a captivating, imaginative, and age-appropriate story segment based on the provided context and choice history. After the story segment, provide 2–4 creative choices for what the reader can do next. Format your response as JSON with two fields: "story" (the story text) and "choices" (an array of strings, each a possible next action).',
        },
        {
          role: "user",
          content: `Seed: ${seed}\nChoices so far: ${JSON.stringify(history)}`,
        },
      ],
      max_tokens: 400,
      temperature: 0.9,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) throw new Error("No response from AI");

    let parsed: StoryNode | null = null;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      }
    }

    if (!parsed || !parsed.story || !parsed.choices) {
      throw new Error("Failed to parse AI response.");
    }

    return new Response(
      JSON.stringify({
        story: parsed.story.trim(),
        choices: parsed.choices,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in generate-story function:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to generate story",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
