import { useCallback, useState } from "react";
import { EdgeFunctions } from "@/lib/edgeFunctions";

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
      console.log("Error generating image:", err.message);
      setError(err.message || "Failed to generate image.");
    } finally {
      setLoading(false);
    }
  }, [prompt]);

  return { imageUrl, loading, error, regenerate: generate };
}
