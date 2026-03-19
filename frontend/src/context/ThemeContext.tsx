import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DARK_COLORS = {
  background: '#121212',
  surface: '#1E1E1E',
  surfaceHighlight: '#2D2D2D',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0BEC5',
  border: '#2D2D2D',
  brand: '#FF5722',
  brandLight: '#FF8A65',
  success: '#00C853',
  error: '#D50000',
};

const LIGHT_COLORS = {
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceHighlight: '#E8E8E8',
  textPrimary: '#121212',
  textSecondary: '#546E7A',
  border: '#E0E0E0',
  brand: '#FF5722',
  brandLight: '#FF8A65',
  success: '#00C853',
  error: '#D50000',
};

export type Colors = typeof DARK_COLORS;

interface ThemeContextType {
  theme: 'dark' | 'light';
  colors: Colors;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  colors: DARK_COLORS,
  toggleTheme: () => {},
  isDark: true,
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    AsyncStorage.getItem('elensar_theme').then((v) => {
      if (v === 'dark' || v === 'light') setTheme(v);
    }).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((p) => {
      const n = p === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem('elensar_theme', n).catch(() => {});
      return n;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, colors: theme === 'dark' ? DARK_COLORS : LIGHT_COLORS, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}
