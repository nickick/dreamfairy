import { useCallback, useEffect, useState } from "react";
import { EdgeFunctions } from "@/lib/edgeFunctions";
import { useLanguage } from "@/contexts/LanguageContext";

export interface StoryNode {
  story: string;
  choices: string[];
}

export interface StoryHistoryItem {
  story: string;
  choiceMade: string | null;
}

export function useGenerateStory(
  seed: string | undefined,
  history: StoryHistoryItem[] = []
) {
  const [story, setStory] = useState<string | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();

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
        language,
      });
      
      setStory(response.story);
      setChoices(response.choices);
    } catch (err: any) {
      setError(err.message || "Failed to generate story.");
    } finally {
      setLoading(false);
    }
  }, [seed, JSON.stringify(history), language]);

  useEffect(() => {
    generate();
  }, [generate]);

  return { story, choices, loading, error, regenerate: generate };
}
