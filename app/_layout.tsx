import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      const inAuthGroup = segments[0] === 'Login';
      
      if (!user && !inAuthGroup) {
        // Redirect to login if not authenticated
        router.replace('/Login');
      } else if (user && inAuthGroup) {
        // Redirect to home if authenticated and on login page
        router.replace('/(tabs)');
      }
    }
  }, [user, loading, segments]);

  return (
    <Stack>
      <Stack.Screen name="Login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="Story" 
        options={{ 
          headerBackTitle: "Pick a new story",
          headerBackTitleVisible: true,
        }} 
      />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    PressStart2P: require('../assets/fonts/PressStart2P-Regular.ttf'),
    Silkscreen: require('../assets/fonts/Silkscreen-Regular.ttf'),
    VT323: require('../assets/fonts/VT323-Regular.ttf'),
    Griffy: require('../assets/fonts/Griffy-Regular.ttf'),
    Almendra: require('../assets/fonts/Almendra-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <RootLayoutNav />
          <StatusBar style="auto" />
        </NavigationThemeProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
