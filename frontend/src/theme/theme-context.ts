import { createContext } from 'react';

import type { Theme } from './theme-constants';

export interface ThemeContextValue {
  /** Theme currently applied to the document (explicit choice or system preference). */
  theme: Theme;
  /** True when the user picked a theme; false when following prefers-color-scheme. */
  isExplicit: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  followSystem: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
