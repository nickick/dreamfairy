import { EdgeFunctions } from "@/lib/edgeFunctions";
import { useCallback, useState } from "react";

export function useGenerateImage(prompt: string | undefined) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!prompt) return;

    setLoading(true);
    setError(null);
    setImageUrl(null);
    try {
      const response = await EdgeFunctions.generateImage({
        prompt,
        width: 512,
        height: 512,
      });

      setImageUrl(response.imageUrl);
    } catch (err: any) {
      setError(err.message || "Failed to generate image.");
      console.error("Error generating image:", err.message);
    } finally {
      setLoading(false);
    }
  }, [prompt]);

  return { imageUrl, loading, error, regenerate: generate };
}
