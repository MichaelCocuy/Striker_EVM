import { useCallback, useEffect, useMemo, useState } from 'react';

import { STORAGE_KEYS } from '@/constants/storage-keys';

import './shell-tokens.css';

import {
  DARK_SCHEME_QUERY,
  isTheme,
  oppositeTheme,
  THEME_ATTRIBUTE,
  THEMES,
} from './theme-constants';
import { ThemeContext } from './theme-context';

import type { Theme } from './theme-constants';
import type { ThemeContextValue } from './theme-context';
import type { ReactNode } from 'react';

function readStoredTheme(): Theme | null {
  try {
    const stored: unknown = window.localStorage.getItem(STORAGE_KEYS.THEME);
    return isTheme(stored) ? stored : null;
  } catch {
    return null;
  }
}

function writeStoredTheme(theme: Theme | null): void {
  try {
    if (theme === null) {
      window.localStorage.removeItem(STORAGE_KEYS.THEME);
    } else {
      window.localStorage.setItem(STORAGE_KEYS.THEME, theme);
    }
  } catch {
    // Persisting the preference is a convenience; the in-memory theme still applies.
  }
}

function readSystemTheme(): Theme {
  return window.matchMedia(DARK_SCHEME_QUERY).matches ? THEMES.DARK : THEMES.LIGHT;
}

function applyThemeAttribute(theme: Theme | null): void {
  const root = document.documentElement;
  if (theme === null) {
    root.removeAttribute(THEME_ATTRIBUTE);
  } else {
    root.setAttribute(THEME_ATTRIBUTE, theme);
  }
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [explicitTheme, setExplicitTheme] = useState<Theme | null>(readStoredTheme);
  const [systemTheme, setSystemTheme] = useState<Theme>(readSystemTheme);

  useEffect(() => {
    const media = window.matchMedia(DARK_SCHEME_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? THEMES.DARK : THEMES.LIGHT);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    applyThemeAttribute(explicitTheme);
    writeStoredTheme(explicitTheme);
  }, [explicitTheme]);

  const theme = explicitTheme ?? systemTheme;

  const setTheme = useCallback((next: Theme) => {
    setExplicitTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setExplicitTheme(oppositeTheme(theme));
  }, [theme]);

  const followSystem = useCallback(() => {
    setExplicitTheme(null);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, isExplicit: explicitTheme !== null, setTheme, toggleTheme, followSystem }),
    [theme, explicitTheme, setTheme, toggleTheme, followSystem],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
