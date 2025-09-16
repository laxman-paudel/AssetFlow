'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

type Theme = 'light' | 'dark';
type ColorTheme = 'theme-default' | 'theme-mint' | 'theme-ocean' | 'theme-sunset' | 'theme-graphite';

interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colorTheme: ColorTheme;
  setColorTheme: (colorTheme: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

const THEME_KEY = 'assetflow-theme-mode';
const COLOR_THEME_KEY = 'assetflow-color-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [colorTheme, setColorThemeState] = useState<ColorTheme>('theme-default');

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
    const storedColorTheme = localStorage.getItem(COLOR_THEME_KEY) as ColorTheme | null;
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
    const initialColorTheme = storedColorTheme || 'theme-default';

    setThemeState(initialTheme);
    setColorThemeState(initialColorTheme);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);
  
  useEffect(() => {
    const root = window.document.documentElement;
    const themes: ColorTheme[] = ['theme-default', 'theme-mint', 'theme-ocean', 'theme-sunset', 'theme-graphite'];
    root.classList.remove(...themes);
    root.classList.add(colorTheme);
    localStorage.setItem(COLOR_THEME_KEY, colorTheme);
  }, [colorTheme]);

  const value = useMemo(() => ({
    theme,
    setTheme: setThemeState,
    colorTheme,
    setColorTheme: setColorThemeState,
  }), [theme, colorTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
