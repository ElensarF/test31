import { Stack } from 'expo-router';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

function RootNav() {
  const { colors, isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'slide_from_right' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="channel-list" />
        <Stack.Screen name="player" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="add-playlist" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootNav />
    </ThemeProvider>
  );
}
