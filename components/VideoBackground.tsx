import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useVideoAsset } from '@/hooks/useVideoAsset';

interface VideoBackgroundProps {
  videoSource: any;
  isStoryPage?: boolean;
}

function VideoPlayerComponent({ uri }: { uri: string }) {
  console.log('[VideoPlayerComponent] Mounting with URI:', uri);
  
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  useEffect(() => {
    const statusListener = player.addListener('statusChange', (status, error) => {
      console.log('[VideoPlayer] Status:', status, 'Error:', error, 'for URI:', uri);
      
      if (error) {
        console.error('[VideoPlayer] Error occurred:', error);
        // Try to recover by playing again
        setTimeout(() => {
          player.play();
        }, 500);
      }
    });
    
    // Ensure video starts playing
    const playInterval = setInterval(() => {
      if (player.status === 'readyToPlay' && !player.playing) {
        console.log('[VideoPlayer] Starting playback');
        player.play();
      }
    }, 1000);
    
    return () => {
      console.log('[VideoPlayerComponent] Unmounting URI:', uri);
      statusListener.remove();
      clearInterval(playInterval);
    };
  }, [player, uri]);

  return (
    <VideoView
      style={StyleSheet.absoluteFill}
      player={player}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

export function VideoBackground({ videoSource, isStoryPage = false }: VideoBackgroundProps) {
  const [hasError, setHasError] = useState(false);
  
  // Convert module ID to URI
  const { uri: videoUri, error: assetError } = useVideoAsset(videoSource);
  
  // Log the video source to debug
  console.log('[VideoBackground] Video source:', videoSource, 'URI:', videoUri);
  
  const { theme, isDark } = useTheme();

  // Handle asset loading errors
  useEffect(() => {
    if (assetError) {
      console.error('[VideoBackground] Asset loading error:', assetError);
      setHasError(true);
    }
  }, [assetError]);

  return (
    <View style={styles.container}>
      {/* Gradient fallback background */}
      <LinearGradient
        colors={theme.colors[isDark ? 'dark' : 'light'].gradientColors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      
      <View style={[styles.blackBackground, { opacity: isDark ? 0.7 : 0.5 }]} />
      
      {/* Only show video if we have a URI and no error */}
      {!hasError && videoUri && (
        <View style={styles.videoContainer}>
          <VideoPlayerComponent
            key={videoUri} // Force remount when URI changes
            uri={videoUri}
          />
        </View>
      )}
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width,
    height,
  },
  videoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  video: {
    width,
    height,
  },
  blackBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width,
    height,
  },
});