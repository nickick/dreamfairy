import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

interface VideoPlayerProps {
  uri: string;
  onStatusChange?: (isReady: boolean) => void;
}

export function VideoPlayer({ uri, onStatusChange }: VideoPlayerProps) {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  useEffect(() => {
    const statusListener = player.addListener('statusChange', (status) => {
      if (status === 'readyToPlay' || status === 'playing') {
        onStatusChange?.(true);
      }
    });

    return () => {
      statusListener.remove();
    };
  }, [player, onStatusChange]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
        nativeControls={false}
      />
    </View>
  );
}