import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

import { REDUCED_MOTION_QUERY } from '@/motion/constants';
import { clearSession } from '@/session/session-store';

const MEDIA_QUERY_DEFAULTS = { matches: false, media: '', onchange: null } as const;

/**
 * jsdom has no matchMedia; ThemeProvider and the motion layer rely on it.
 * Reduced motion is on by default so GSAP jumps to final states and queries see visible DOM.
 */
function installMatchMedia(): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      ...MEDIA_QUERY_DEFAULTS,
      media: query,
      matches: query === REDUCED_MOTION_QUERY,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

beforeAll(() => {
  installMatchMedia();
});

afterEach(() => {
  cleanup();
  clearSession();
  window.localStorage.clear();
  window.sessionStorage.clear();
});
