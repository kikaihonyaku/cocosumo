/**
 * Theme Context
 * Dark mode / Light mode management
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Theme mode types
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Storage key
const THEME_STORAGE_KEY = 'cocosumo_theme_mode';

// Create context
const ThemeContext = createContext(null);

// Light theme palette
const lightPalette = {
  mode: 'light',
  primary: {
    main: '#1976d2',
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#fff'
  },
  secondary: {
    main: '#9c27b0',
    light: '#ba68c8',
    dark: '#7b1fa2',
    contrastText: '#fff'
  },
  error: {
    main: '#d32f2f',
    light: '#ef5350',
    dark: '#c62828'
  },
  warning: {
    main: '#ed6c02',
    light: '#ff9800',
    dark: '#e65100'
  },
  info: {
    main: '#0288d1',
    light: '#03a9f4',
    dark: '#01579b'
  },
  success: {
    main: '#2e7d32',
    light: '#4caf50',
    dark: '#1b5e20'
  },
  background: {
    default: '#f5f5f5',
    paper: '#ffffff'
  },
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)'
  },
  divider: 'rgba(0, 0, 0, 0.12)'
};

// Dark theme palette
const darkPalette = {
  mode: 'dark',
  primary: {
    main: '#90caf9',
    light: '#e3f2fd',
    dark: '#42a5f5',
    contrastText: 'rgba(0, 0, 0, 0.87)'
  },
  secondary: {
    main: '#ce93d8',
    light: '#f3e5f5',
    dark: '#ab47bc',
    contrastText: 'rgba(0, 0, 0, 0.87)'
  },
  error: {
    main: '#f44336',
    light: '#e57373',
    dark: '#d32f2f'
  },
  warning: {
    main: '#ffa726',
    light: '#ffb74d',
    dark: '#f57c00'
  },
  info: {
    main: '#29b6f6',
    light: '#4fc3f7',
    dark: '#0288d1'
  },
  success: {
    main: '#66bb6a',
    light: '#81c784',
    dark: '#388e3c'
  },
  background: {
    default: '#121212',
    paper: '#1e1e1e'
  },
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    disabled: 'rgba(255, 255, 255, 0.5)'
  },
  divider: 'rgba(255, 255, 255, 0.12)'
};

// Common theme options
const commonThemeOptions = {
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"'
    ].join(','),
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        }
      }
    }
  }
};

// Create MUI theme
function createAppTheme(mode) {
  const palette = mode === 'dark' ? darkPalette : lightPalette;

  return createTheme({
    palette,
    ...commonThemeOptions
  });
}

// Get initial theme mode
function getInitialThemeMode() {
  if (typeof window === 'undefined') return THEME_MODES.LIGHT;

  // Check localStorage
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored && Object.values(THEME_MODES).includes(stored)) {
    return stored;
  }

  // Default to system
  return THEME_MODES.SYSTEM;
}

// Get system preference
function getSystemPreference() {
  if (typeof window === 'undefined') return 'light';

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * Theme Provider Component
 */
export function ThemeContextProvider({ children }) {
  const [themeMode, setThemeMode] = useState(getInitialThemeMode);
  const [systemPreference, setSystemPreference] = useState(getSystemPreference);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Persist theme mode
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);

    // Update meta theme-color
    const effectiveMode = themeMode === THEME_MODES.SYSTEM ? systemPreference : themeMode;
    const themeColor = effectiveMode === 'dark' ? '#121212' : '#1976d2';

    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.content = themeColor;
    }

    // Add class to body for CSS custom properties
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${effectiveMode}`);
  }, [themeMode, systemPreference]);

  // Calculate effective mode
  const effectiveMode = useMemo(() => {
    return themeMode === THEME_MODES.SYSTEM ? systemPreference : themeMode;
  }, [themeMode, systemPreference]);

  // Create theme
  const theme = useMemo(() => {
    return createAppTheme(effectiveMode);
  }, [effectiveMode]);

  // Theme mode setters
  const setLightMode = useCallback(() => setThemeMode(THEME_MODES.LIGHT), []);
  const setDarkMode = useCallback(() => setThemeMode(THEME_MODES.DARK), []);
  const setSystemMode = useCallback(() => setThemeMode(THEME_MODES.SYSTEM), []);

  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => {
      if (prev === THEME_MODES.LIGHT) return THEME_MODES.DARK;
      if (prev === THEME_MODES.DARK) return THEME_MODES.SYSTEM;
      return THEME_MODES.LIGHT;
    });
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeMode((prev) => {
      if (prev === THEME_MODES.LIGHT) return THEME_MODES.DARK;
      return THEME_MODES.LIGHT;
    });
  }, []);

  const contextValue = useMemo(() => ({
    themeMode,
    effectiveMode,
    isDarkMode: effectiveMode === 'dark',
    isLightMode: effectiveMode === 'light',
    isSystemMode: themeMode === THEME_MODES.SYSTEM,
    setThemeMode,
    setLightMode,
    setDarkMode,
    setSystemMode,
    toggleTheme,
    cycleTheme,
    theme
  }), [themeMode, effectiveMode, setLightMode, setDarkMode, setSystemMode, toggleTheme, cycleTheme, theme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

/**
 * Hook to use theme context
 */
export function useThemeMode() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useThemeMode must be used within ThemeContextProvider');
  }

  return context;
}

export default ThemeContext;
