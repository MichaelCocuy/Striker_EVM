import { useEffect, useState } from 'react';

import { DARK_SCHEME_QUERY, THEME_ATTRIBUTE } from '@/theme/theme-constants';

/**
 * Recharts paints SVG *presentation attributes* (`fill`, `stroke`), which do not accept
 * `var(--token)`. So the chart resolves the design tokens against the document root and
 * re-resolves them whenever the active theme changes, either because the user toggled it
 * (the `data-theme` attribute) or because the system color scheme changed.
 */

export type TokenColors = Record<string, string>;

function resolveToken(token: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  /** Without a stylesheet (jsdom) the CSS variable itself is the honest answer. */
  return value === '' ? `var(${token})` : value;
}

function resolveTokens(tokens: readonly string[]): TokenColors {
  return Object.fromEntries(tokens.map((token) => [token, resolveToken(token)]));
}

/** Resolves design tokens to colors. `tokens` must be a stable array (a module constant). */
export function useTokenColors(tokens: readonly string[]): TokenColors {
  const [colors, setColors] = useState<TokenColors>(() => resolveTokens(tokens));

  useEffect(() => {
    const refresh = () => setColors(resolveTokens(tokens));
    const observer = new MutationObserver(refresh);
    observer.observe(document.documentElement, { attributeFilter: [THEME_ATTRIBUTE] });
    const media = window.matchMedia(DARK_SCHEME_QUERY);
    media.addEventListener('change', refresh);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', refresh);
    };
  }, [tokens]);

  return colors;
}
