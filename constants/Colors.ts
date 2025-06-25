/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#FF6B6B';
const tintColorDark = '#FFE66D';

export const Colors = {
  light: {
    text: '#2D3436',
    background: '#DFE6E9',
    tint: tintColorLight,
    icon: '#636E72',
    tabIconDefault: '#636E72',
    tabIconSelected: tintColorLight,
    retroPurple: '#A29BFE',
    retroPink: '#FD79A8',
    retroBlue: '#74B9FF',
    retroGreen: '#55EFC4',
    retroYellow: '#FFE66D',
    retroOrange: '#FF7675',
  },
  dark: {
    text: '#F5F3F4',
    background: '#2D3436',
    tint: tintColorDark,
    icon: '#B2BEC3',
    tabIconDefault: '#B2BEC3',
    tabIconSelected: tintColorDark,
    retroPurple: '#6C5CE7',
    retroPink: '#E84393',
    retroBlue: '#0984E3',
    retroGreen: '#00B894',
    retroYellow: '#FDCB6E',
    retroOrange: '#E17055',
  },
};
