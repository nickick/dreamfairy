import { useCallback, useState } from "react";

const GETIMG_API_KEY = process.env.EXPO_PUBLIC_GETIMG_API_KEY || '';
const GETIMG_API_URL = "https://api.getimg.ai/v1/flux-schnell/text-to-image";

export function useGenerateImage(prompt: string | undefined) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!prompt) return;
    
    if (!GETIMG_API_KEY) {
      console.error('GetImg API key not configured');
      setError('Image generation API key not configured');
      return;
    }
    
    setLoading(true);
    setError(null);
    setImageUrl(null);
    try {
      const response = await fetch(GETIMG_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GETIMG_API_KEY}`,
        },
        body: JSON.stringify({
          prompt,
          steps: 4,
          width: 512,
          height: 512,
          response_format: "url",
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData);
        throw new Error("Failed to generate image");
      }
      const data = await response.json();
      const url = data.image_url || data.url || data.images?.[0]?.url || null;
      setImageUrl(url);
    } catch (err: any) {
      console.log("Error generating image:", err.message);
      setError(err.message || "Failed to generate image.");
    } finally {
      setLoading(false);
    }
  }, [prompt]);

  return { imageUrl, loading, error, regenerate: generate };
}
