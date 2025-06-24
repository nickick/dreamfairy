import { OPENAI_API_KEY } from "@env";
import { OpenAI } from "openai";
import { useCallback, useEffect, useState } from "react";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export interface StoryNode {
  story: string;
  choices: string[];
}

export function useGenerateStory(
  seed: string | undefined,
  history: string[] = []
) {
  const [story, setStory] = useState<string | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!seed) return;
    setLoading(true);
    setError(null);
    setStory(null);
    setChoices([]);
    try {
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
            content: `Seed: ${seed}\nChoices so far: ${JSON.stringify(
              history
            )}`,
          },
        ],
        max_tokens: 400,
        temperature: 0.9,
      });
      const content = response.choices?.[0]?.message?.content;
      if (!content) throw new Error("No response from AI");
      // Try to parse JSON from the response
      let parsed: StoryNode | null = null;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        // Try to extract JSON from text if AI wrapped it in markdown
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        }
      }
      if (!parsed || !parsed.story || !parsed.choices) {
        throw new Error("Failed to parse AI response.");
      }
      setStory(parsed.story.trim());
      setChoices(parsed.choices);
    } catch (err: any) {
      setError(err.message || "Failed to generate story.");
    } finally {
      setLoading(false);
    }
  }, [seed, JSON.stringify(history)]);

  useEffect(() => {
    generate();
  }, [generate]);

  return { story, choices, loading, error, regenerate: generate };
}
