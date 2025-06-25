import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

export function RetroBackground({ children, style }: { children: React.ReactNode; style?: any }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const dotColor = isDark ? Colors.dark.icon : Colors.light.icon;
  const bgColor = isDark ? Colors.dark.background : Colors.light.background;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }, style]}>
      <View style={styles.pixelGrid}>
        {Array.from({ length: 200 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.pixel,
              {
                backgroundColor: i % 7 === 0 ? dotColor : 'transparent',
                opacity: 0.1,
              },
            ]}
          />
        ))}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  pixelGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    zIndex: 0,
  },
  pixel: {
    width: '5%',
    height: 20,
  },
});