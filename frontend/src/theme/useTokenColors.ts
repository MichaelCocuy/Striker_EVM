import { useEffect, useMemo, useState } from 'react';

import { DARK_SCHEME_QUERY, THEME_ATTRIBUTE } from './theme-constants';

/**
 * Resolves design tokens to the colors of the active theme, and re-resolves them whenever the
 * theme changes — because the user toggled it (the `data-theme` attribute on the root) or
 * because the system color scheme did.
 *
 * Needed wherever a color cannot stay as `var(--token)` in CSS: SVG presentation attributes
 * (`fill`, `stroke`) that Recharts paints, and values a tween has to interpolate.
 */

export type TokenColors = Record<string, string>;

/** A custom property name cannot contain a space, so joining on one is a lossless key. */
const TOKEN_KEY_SEPARATOR = ' ';

function resolveToken(token: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  /** Without a stylesheet (jsdom) the CSS variable itself is the honest answer. */
  return value === '' ? `var(${token})` : value;
}

function resolveTokens(tokens: readonly string[]): TokenColors {
  return Object.fromEntries(tokens.map((token) => [token, resolveToken(token)]));
}

/** The token list may be a fresh array on every render; only its contents matter. */
export function useTokenColors(tokens: readonly string[]): TokenColors {
  const tokenKey = tokens.join(TOKEN_KEY_SEPARATOR);
  const requestedTokens = useMemo(
    () => (tokenKey === '' ? [] : tokenKey.split(TOKEN_KEY_SEPARATOR)),
    [tokenKey],
  );
  const [colors, setColors] = useState<TokenColors>(() => resolveTokens(tokens));

  useEffect(() => {
    const refresh = () => setColors(resolveTokens(requestedTokens));
    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.documentElement, { attributeFilter: [THEME_ATTRIBUTE] });
    const media = window.matchMedia(DARK_SCHEME_QUERY);
    media.addEventListener('change', refresh);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', refresh);
    };
  }, [requestedTokens]);

  return colors;
}
