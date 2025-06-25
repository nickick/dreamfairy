export interface Theme {
  name: string;
  colors: {
    light: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
      border: string;
      cardBackground: string;
      buttonBackground: string;
      gradientColors: string[];
    };
    dark: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
      border: string;
      cardBackground: string;
      buttonBackground: string;
      gradientColors: string[];
    };
  };
  fonts: {
    title: string;
    body: string;
    button: string;
  };
  styles: {
    borderRadius: number;
    borderWidth: number;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    buttonShadow: boolean;
  };
}

export const retroFutureTheme: Theme = {
  name: 'retroFuture',
  colors: {
    light: {
      primary: '#74B9FF',
      secondary: '#55EFC4',
      accent: '#FFE66D',
      background: '#DFE6E9',
      text: '#2D3436',
      border: '#2D3436',
      cardBackground: '#FFE66D',
      buttonBackground: '#55EFC4',
      gradientColors: ['#FD79A8', '#A29BFE', '#74B9FF'],
    },
    dark: {
      primary: '#0984E3',
      secondary: '#00B894',
      accent: '#FDCB6E',
      background: '#2D3436',
      text: '#F5F3F4',
      border: '#F5F3F4',
      cardBackground: '#6C5CE7',
      buttonBackground: '#00B894',
      gradientColors: ['#E84393', '#6C5CE7', '#0984E3'],
    },
  },
  fonts: {
    title: 'Silkscreen',
    body: 'VT323',
    button: 'Silkscreen',
  },
  styles: {
    borderRadius: 0,
    borderWidth: 4,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    buttonShadow: true,
  },
};

export const enchantedForestTheme: Theme = {
  name: 'enchantedForest',
  colors: {
    light: {
      primary: '#8FBC8F', // Soft sage green
      secondary: '#DDA0DD', // Plum/lavender
      accent: '#F0E68C', // Khaki/golden
      background: '#F5F5DC', // Beige
      text: '#2F4F2F', // Dark forest green
      border: '#4A5D23', // Moss green
      cardBackground: '#E6F3E6', // Pale mint
      buttonBackground: '#98D8C8', // Mint teal
      gradientColors: ['#98FB98', '#F0E68C', '#DDA0DD'], // Pale green to gold to lavender
    },
    dark: {
      primary: '#228B22', // Forest green
      secondary: '#9370DB', // Medium purple
      accent: '#DAA520', // Goldenrod
      background: '#1C1C1C', // Very dark gray
      text: '#E8F5E9', // Very light green
      border: '#556B2F', // Dark olive green
      cardBackground: '#2E4A2E', // Dark forest
      buttonBackground: '#3CB371', // Medium sea green
      gradientColors: ['#2E8B57', '#4B0082', '#483D8B'], // Sea green to indigo to dark slate blue
    },
  },
  fonts: {
    title: 'Griffy',
    body: 'Almendra',
    button: 'Griffy',
  },
  styles: {
    borderRadius: 16,
    borderWidth: 4,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    buttonShadow: true,
  },
};

export const themes = {
  retroFuture: retroFutureTheme,
  enchantedForest: enchantedForestTheme,
};

export const storyThemeMap: Record<string, 'retroFuture' | 'enchantedForest'> = {
  'A magical forest adventure': 'enchantedForest',
  'A lost robot in space': 'retroFuture',
  'The secret life of a city cat': 'retroFuture',
  'A fairy\'s quest to save the moon': 'enchantedForest',
};