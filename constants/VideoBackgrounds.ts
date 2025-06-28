export interface ThemeVideos {
  homepage: any;
  story: any;
}

// Store the require() results which are module IDs
const videoSources = {
  retroFuture: {
    homepage: require('@/assets/videos/retro-future-homepage.mp4'),
    story: require('@/assets/videos/retro-future-story.mp4'),
  },
  enchantedForest: {
    homepage: require('@/assets/videos/enchanted-forest-homepage.mp4'),
    story: require('@/assets/videos/enchanted-forest-story.mp4'),
  },
};

export const themeVideoMap: Record<'retroFuture' | 'enchantedForest', ThemeVideos> = videoSources;

export function getVideoForTheme(themeName: 'retroFuture' | 'enchantedForest', pageType: 'homepage' | 'story') {
  return videoSources[themeName][pageType];
}