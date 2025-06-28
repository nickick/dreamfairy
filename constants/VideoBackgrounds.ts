export interface ThemeVideos {
  homepage: any;
  story: any;
}

export const themeVideoMap: Record<'retroFuture' | 'enchantedForest', ThemeVideos> = {
  retroFuture: {
    homepage: require('@/assets/videos/retro-future-homepage.mp4'),
    story: require('@/assets/videos/retro-future-story.mp4'),
  },
  enchantedForest: {
    homepage: require('@/assets/videos/enchanted-forest-homepage.mp4'),
    story: require('@/assets/videos/enchanted-forest-story.mp4'),
  },
};

export function getVideoForTheme(themeName: 'retroFuture' | 'enchantedForest', pageType: 'homepage' | 'story') {
  return themeVideoMap[themeName][pageType];
}