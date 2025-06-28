import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTheme } from '@/contexts/ThemeContext';

interface VideoBackgroundProps {
  videoSource: any;
  isStoryPage?: boolean;
}

export function VideoBackground({ videoSource, isStoryPage = false }: VideoBackgroundProps) {
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const blackFadeAnim = useRef(new Animated.Value(0)).current;
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [currentSource, setCurrentSource] = useState(videoSource);
  const { isDark } = useTheme();

  useEffect(() => {
    if (videoSource !== currentSource) {
      // First fade to black
      Animated.timing(blackFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // Then switch video source
        setCurrentSource(videoSource);
        setIsVideoLoaded(false);
        // Replace the video source
        player.replaceAsync(videoSource).then(() => {
          player.play();
        });
        // Keep black overlay while new video loads
      });
    }
  }, [videoSource, currentSource, blackFadeAnim, player]);

  useEffect(() => {
    if (isVideoLoaded && currentSource === videoSource) {
      // Fade out the black overlay when video is ready
      Animated.timing(blackFadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [isVideoLoaded, currentSource, videoSource, blackFadeAnim]);

  // Monitor player status to detect when video is loaded
  useEffect(() => {
    const statusListener = player.addListener('statusChange', (status) => {
      if (status === 'readyToPlay') {
        setIsVideoLoaded(true);
      }
    });

    return () => {
      statusListener.remove();
    };
  }, [player]);

  return (
    <View style={styles.container}>
      <View style={[styles.blackBackground, { opacity: isDark ? 0.7 : 0.5 }]} />
      <View style={styles.videoContainer}>
        <VideoView
          style={styles.video}
          player={player}
          contentFit="cover"
          nativeControls={false}
        />
      </View>
      {/* Black fade overlay for transitions */}
      <Animated.View 
        style={[
          styles.blackBackground, 
          { 
            backgroundColor: '#000',
            opacity: blackFadeAnim
          }
        ]} 
        pointerEvents="none"
      />
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
});