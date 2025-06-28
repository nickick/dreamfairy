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
  language?: "en" | "tl" | "zh" | "yue";
}

function getSystemPrompt(language: string): string {
  const prompts = {
    en: 'You are a magical storybook AI for children. Write a captivating, imaginative, and age-appropriate story segment based on the provided context and choice history. After the story segment, provide 2–4 creative choices for what the reader can do next. Format your response as JSON with two fields: "story" (the story text) and "choices" (an array of strings, each a possible next action).',

    tl: 'Ikaw ay isang mahiwagang AI ng kuwentong pambata. Sumulat ng nakaakit, mapanlikha, at angkop sa edad na bahagi ng kuwento batay sa ibinigay na konteksto at kasaysayan ng pagpili. Pagkatapos ng bahagi ng kuwento, magbigay ng 2-4 na mapanlikhang pagpipilian para sa susunod na gagawin ng mambabasa. I-format ang iyong tugon bilang JSON na may dalawang field: "story" (ang teksto ng kuwento sa Tagalog) at "choices" (isang array ng mga string sa Tagalog, bawat isa ay posibleng susunod na aksyon).',

    zh: '你是一个神奇的儿童故事书AI。请根据提供的背景和选择历史，写一段引人入胜、富有想象力且适合儿童的故事片段。在故事片段之后，为读者接下来可以做什么提供2-4个创造性的选择。将您的回复格式化为JSON，包含两个字段："story"（中文故事文本）和"choices"（中文字符串数组，每个都是可能的下一步行动）。',

    yue: '你係一個神奇嘅兒童故事書AI。請根據提供嘅背景同選擇歷史，寫一段引人入勝、富有想像力同適合兒童嘅故事片段。喺故事片段之後，為讀者接下來可以做乜嘢提供2-4個創意選擇。將你嘅回覆格式化為JSON，包含兩個字段："story"（廣東話故事文本）同"choices"（廣東話字符串數組，每個都係可能嘅下一步行動）。',
  };

  return prompts[language as keyof typeof prompts] || prompts.en;
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
      seed,
      history = [],
      language = "en",
    }: RequestBody = await req.json();

    console.log(history);

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
          content: getSystemPrompt(language),
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
