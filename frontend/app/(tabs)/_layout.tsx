import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { Platform } from 'react-native';

export default function TabLayout() {
  const { colors } = useTheme();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.brand,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        height: Platform.OS === 'ios' ? 88 : 64,
        paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        paddingTop: 8,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' as const },
    }}>
      <Tabs.Screen name="index" options={{
        title: 'Ana Sayfa',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="home-variant" size={size} color={color} />,
      }} />
      <Tabs.Screen name="categories" options={{
        title: 'Kategoriler',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="view-grid" size={size} color={color} />,
      }} />
      <Tabs.Screen name="search" options={{
        title: 'Ara',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="magnify" size={size} color={color} />,
      }} />
      <Tabs.Screen name="favorites" options={{
        title: 'Favoriler',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="heart" size={size} color={color} />,
      }} />
      <Tabs.Screen name="settings" options={{
        title: 'Ayarlar',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name="cog-outline" size={size} color={color} />,
      }} />
    </Tabs>
  );
}
