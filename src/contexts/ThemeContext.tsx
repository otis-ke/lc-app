import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyThemeColors, colors, darkNeutrals, lightNeutrals, type ThemeMode } from '../theme/theme';

const STORAGE_KEY = 'lc-theme-mode';

function readSavedModeSync(): ThemeMode | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    }
  } catch {
    // ignore
  }
  return null;
}

interface ThemeContextValue {
  mode: ThemeMode;
  colors: typeof colors;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Dark is the app's default look (see theme.ts's darkNeutrals, matched to
// the brand's black/gold reference design). On web, switching modes forces
// a full page reload — see setMode() below and theme.ts's synchronous
// localStorage bootstrap for why that's what makes the switch actually
// repaint every screen instead of only the handful of shared components
// that can safely update live. Native doesn't reload (no synchronous
// storage there) and keeps that narrower, always-safe live scope.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readSavedModeSync() ?? 'dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if ((saved === 'light' || saved === 'dark') && saved !== mode) {
          applyThemeColors(saved);
          setModeState(saved);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setMode(next: ThemeMode) {
    applyThemeColors(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Full reload re-evaluates every module fresh, so this time every
      // screen's own frozen StyleSheet.create bakes in the new colors —
      // see theme.ts's bootstrap, which reads the value just saved above.
      window.location.reload();
      return;
    }
    setModeState(next);
  }

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colors: mode === 'dark' ? { ...colors, ...darkNeutrals } : { ...colors, ...lightNeutrals },
      toggleMode: () => setMode(mode === 'dark' ? 'light' : 'dark'),
      setMode,
    }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
