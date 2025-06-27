import { useState, useCallback } from "react";
import { EdgeFunctions } from "@/lib/edgeFunctions";

interface AssetGenerationResult {
  imageUrl?: string;
  narrationUrl?: string;
}

export function useAssetGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAssets, setGeneratedAssets] = useState<AssetGenerationResult | null>(null);

  const generateAssets = useCallback(async (story: string) => {
    setIsGenerating(true);
    const result: AssetGenerationResult = {};

    try {
      // Start both generations in parallel
      const [imageResult, narrationResult] = await Promise.allSettled([
        // Image generation
        EdgeFunctions.generateImage({
          prompt: story,
          width: 512,
          height: 512,
        }).catch((err) => {
          console.error("[useAssetGeneration] Image generation failed:", err);
          return null;
        }),
        // Narration generation
        EdgeFunctions.textToSpeech({
          text: story,
          voiceType: "narrator",
        }).catch((err) => {
          console.error("[useAssetGeneration] Narration generation failed:", err);
          return null;
        }),
      ]);

      // Extract results
      if (imageResult.status === "fulfilled" && imageResult.value) {
        result.imageUrl = imageResult.value.imageUrl;
      }
      if (narrationResult.status === "fulfilled" && narrationResult.value) {
        result.narrationUrl = narrationResult.value.audioUrl;
      }

      setGeneratedAssets(result);
      return result;
    } catch (error) {
      console.error("[useAssetGeneration] Error generating assets:", error);
      return result;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearAssets = useCallback(() => {
    setGeneratedAssets(null);
  }, []);

  return { generateAssets, isGenerating, generatedAssets, clearAssets };
}