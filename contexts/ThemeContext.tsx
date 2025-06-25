import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { retroFutureTheme, enchantedForestTheme, Theme } from '@/constants/Themes';

type ThemeName = 'retroFuture' | 'enchantedForest';

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>('retroFuture');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const theme = themeName === 'retroFuture' ? retroFutureTheme : enchantedForestTheme;

  return (
    <ThemeContext.Provider value={{ theme, themeName, setThemeName, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}