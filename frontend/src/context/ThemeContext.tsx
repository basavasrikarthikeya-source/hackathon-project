import React, { createContext, useContext, useState, useEffect } from 'react';
import { ColorTheme } from '../types';

interface ThemeContextType {
  theme: ColorTheme;
  setTheme: (theme: ColorTheme) => void;
  themeConfig: {
    id: ColorTheme;
    name: string;
    description: string;
    primaryHex: string;
    accentHex: string;
    badgeClass: string;
    dotClass: string;
  };
  availableThemes: Array<{
    id: ColorTheme;
    name: string;
    tagline: string;
    primaryHex: string;
    accentHex: string;
    dotClass: string;
  }>;
}

const THEMES_CONFIG = {
  orbit: {
    id: 'orbit' as ColorTheme,
    name: 'Orbit Cyan',
    tagline: 'Deep space obsidian & cyan telemetry',
    description: 'High-tech orbital radar aesthetic with cyan neon accents',
    primaryHex: '#06b6d4',
    accentHex: '#22d3ee',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    dotClass: 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]'
  },
  emerald: {
    id: 'emerald' as ColorTheme,
    name: 'Emerald Earth',
    tagline: 'Biosphere, forest & canopy observation',
    description: 'Natural earth monitoring with vivid emerald & mint tones',
    primaryHex: '#10b981',
    accentHex: '#34d399',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dotClass: 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
  },
  deepspace: {
    id: 'deepspace' as ColorTheme,
    name: 'Deep Space',
    tagline: 'Galactic ultraviolet & cosmic violet',
    description: 'Astrophysical telescope dark-field styling',
    primaryHex: '#8b5cf6',
    accentHex: '#a78bfa',
    badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    dotClass: 'bg-violet-400 shadow-[0_0_8px_#8b5cf6]'
  },
  tactical: {
    id: 'tactical' as ColorTheme,
    name: 'Tactical Amber',
    tagline: 'Night-vision FLIR & military HUD',
    description: 'High-contrast low-light surveillance & crisis monitoring',
    primaryHex: '#f59e0b',
    accentHex: '#fbbf24',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dotClass: 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ColorTheme>(() => {
    const saved = localStorage.getItem('drishti-theme');
    if (saved && (saved === 'orbit' || saved === 'emerald' || saved === 'deepspace' || saved === 'tactical')) {
      return saved as ColorTheme;
    }
    return 'orbit';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('drishti-theme', theme);
  }, [theme]);

  const availableThemes = Object.values(THEMES_CONFIG).map(t => ({
    id: t.id,
    name: t.name,
    tagline: t.tagline,
    primaryHex: t.primaryHex,
    accentHex: t.accentHex,
    dotClass: t.dotClass
  }));

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        themeConfig: THEMES_CONFIG[theme],
        availableThemes
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
