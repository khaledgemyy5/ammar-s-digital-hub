import * as React from 'react';
import { getPublicSiteSettings } from '@/lib/db';
import type { ThemeConfig } from '@/types/database';

interface ThemeContextValue {
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  applyTheme: (theme: ThemeConfig) => void;
}

const defaultTheme: ThemeConfig = {
  accentColor: '#135BEC',
  primaryColor: '#135BEC',
  defaultMode: 'light',
  font: 'ibm-plex',
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

// Convert hex to HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Apply theme to document
function applyThemeToDocument(theme: ThemeConfig) {
  const root = document.documentElement;
  
  // Apply accent color
  if (theme.accentColor) {
    const hsl = hexToHSL(theme.accentColor);
    root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    root.style.setProperty('--accent', `${hsl.h} ${hsl.s}% ${Math.min(hsl.l + 40, 95)}%`);
    
    // For ring/focus states
    root.style.setProperty('--ring', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
  }
  
  // Apply primary color if different
  if (theme.primaryColor && theme.primaryColor !== theme.accentColor) {
    const hsl = hexToHSL(theme.primaryColor);
    root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
  }
  
  // Apply font
  if (theme.font) {
    switch (theme.font) {
      case 'ibm-plex':
        root.style.setProperty('--font-heading', "'IBM Plex Serif', Georgia, serif");
        root.style.setProperty('--font-body', "'Inter', system-ui, sans-serif");
        break;
      case 'inter':
        root.style.setProperty('--font-heading', "'Inter', system-ui, sans-serif");
        root.style.setProperty('--font-body', "'Inter', system-ui, sans-serif");
        break;
      case 'system':
        root.style.setProperty('--font-heading', 'system-ui, sans-serif');
        root.style.setProperty('--font-body', 'system-ui, sans-serif');
        break;
    }
  }
  
  // Apply dark/light mode
  if (theme.defaultMode === 'dark') {
    root.classList.add('dark');
  } else if (theme.defaultMode === 'light') {
    root.classList.remove('dark');
  } else if (theme.defaultMode === 'system') {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}

// Save theme to localStorage for FOUC prevention
function saveThemeToLocalStorage(theme: ThemeConfig) {
  try {
    localStorage.setItem('site_theme', JSON.stringify(theme));
  } catch (e) {
    console.warn('Failed to save theme to localStorage:', e);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<ThemeConfig>(defaultTheme);

  React.useEffect(() => {
    // Load theme from settings
    async function loadTheme() {
      const settings = await getPublicSiteSettings();
      if (settings?.theme) {
        const loadedTheme = settings.theme as ThemeConfig;
        setThemeState(loadedTheme);
        applyThemeToDocument(loadedTheme);
        // Cache theme in localStorage for next page load (prevents FOUC)
        saveThemeToLocalStorage(loadedTheme);
      }
    }
    loadTheme();
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme.defaultMode === 'system') {
        applyThemeToDocument(theme);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = (newTheme: ThemeConfig) => {
    setThemeState(newTheme);
    applyThemeToDocument(newTheme);
    // Update localStorage cache
    saveThemeToLocalStorage(newTheme);
  };

  const applyTheme = (newTheme: ThemeConfig) => {
    applyThemeToDocument(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}