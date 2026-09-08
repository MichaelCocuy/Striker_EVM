import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { THEME_ATTRIBUTE, THEMES } from './theme-constants';
import { useTokenColors } from './useTokenColors';

const TOKEN = '--evm-good';
const OTHER_TOKEN = '--evm-bad';
const LIGHT_COLOR = 'rgb(21, 128, 61)';
const DARK_COLOR = 'rgb(74, 222, 128)';

function paintToken(token: string, color: string): void {
  document.documentElement.style.setProperty(token, color);
}

/** Applies the theme the way ThemeProvider does, so the hook's observer fires. */
function applyTheme(theme: string, token: string, color: string): void {
  paintToken(token, color);
  document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
}

afterEach(() => {
  document.documentElement.removeAttribute(THEME_ATTRIBUTE);
  document.documentElement.style.removeProperty(TOKEN);
  document.documentElement.style.removeProperty(OTHER_TOKEN);
});

describe('useTokenColors', () => {
  it('resolves a token to the color of the active theme', () => {
    paintToken(TOKEN, LIGHT_COLOR);

    const { result } = renderHook(() => useTokenColors([TOKEN]));

    expect(result.current[TOKEN]).toBe(LIGHT_COLOR);
  });

  it('re-resolves when the theme changes, so a status keeps no stale color', async () => {
    paintToken(TOKEN, LIGHT_COLOR);
    const { result } = renderHook(() => useTokenColors([TOKEN]));
    expect(result.current[TOKEN]).toBe(LIGHT_COLOR);

    await act(async () => {
      applyTheme(THEMES.DARK, TOKEN, DARK_COLOR);
      await Promise.resolve();
    });

    expect(result.current[TOKEN]).toBe(DARK_COLOR);
  });

  it('re-resolves when the requested tokens change', () => {
    paintToken(TOKEN, LIGHT_COLOR);
    paintToken(OTHER_TOKEN, DARK_COLOR);
    const { result, rerender } = renderHook(({ tokens }) => useTokenColors(tokens), {
      initialProps: { tokens: [TOKEN] },
    });
    expect(result.current[TOKEN]).toBe(LIGHT_COLOR);

    rerender({ tokens: [OTHER_TOKEN] });

    expect(result.current[OTHER_TOKEN]).toBe(DARK_COLOR);
  });

  it('falls back to the CSS variable when no stylesheet defines the token', () => {
    const { result } = renderHook(() => useTokenColors(['--not-defined-anywhere']));

    expect(result.current['--not-defined-anywhere']).toBe('var(--not-defined-anywhere)');
  });
});
