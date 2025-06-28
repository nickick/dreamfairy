import { useEffect, useState } from 'react';
import { Asset } from 'expo-asset';

export function useVideoAsset(moduleId: number | string) {
  const [uri, setUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAsset = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // If it's already a string URI, use it directly
        if (typeof moduleId === 'string') {
          if (isMounted) {
            setUri(moduleId);
            setIsLoading(false);
          }
          return;
        }

        // Otherwise, resolve the asset
        const asset = Asset.fromModule(moduleId);
        await asset.downloadAsync();
        
        if (isMounted) {
          setUri(asset.localUri || asset.uri);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          setIsLoading(false);
          console.error('[useVideoAsset] Error loading asset:', err);
        }
      }
    };

    loadAsset();

    return () => {
      isMounted = false;
    };
  }, [moduleId]);

  return { uri, isLoading, error };
}