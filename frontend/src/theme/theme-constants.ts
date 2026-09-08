export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

export type Theme = (typeof THEMES)[keyof typeof THEMES];

export const THEME_ATTRIBUTE = 'data-theme';
export const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

export function isTheme(value: unknown): value is Theme {
  return value === THEMES.LIGHT || value === THEMES.DARK;
}

export function oppositeTheme(theme: Theme): Theme {
  return theme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
}
