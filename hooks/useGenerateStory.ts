import { useCallback, useEffect, useState } from "react";
import { EdgeFunctions } from "@/lib/edgeFunctions";

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
      const response = await EdgeFunctions.generateStory({
        seed,
        history,
      });
      
      setStory(response.story);
      setChoices(response.choices);
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
