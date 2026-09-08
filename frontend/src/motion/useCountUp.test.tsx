import { act, renderHook } from '@testing-library/react';
import gsap from 'gsap';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { REDUCED_MOTION_QUERY } from './constants';
import { prefersReducedMotion } from './reduced-motion';
import { useCountUp } from './useCountUp';

function setReducedMotion(matches: boolean): void {
  vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
    matches: query === REDUCED_MOTION_QUERY ? matches : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

afterEach(() => {
  setReducedMotion(false);
});

describe('reduced motion detection', () => {
  it('reads the prefers-reduced-motion media query', () => {
    setReducedMotion(true);
    expect(prefersReducedMotion()).toBe(true);
    setReducedMotion(false);
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe('useCountUp', () => {
  it('starts at the initial value without animating', () => {
    const { result } = renderHook(() => useCountUp(29000, { decimals: 2 }));
    expect(result.current).toBe(29000);
  });

  it('jumps straight to the new value when reduced motion is preferred', () => {
    setReducedMotion(true);
    const gsapSpy = vi.spyOn(gsap, 'to');
    const { result, rerender } = renderHook(({ value }) => useCountUp(value), {
      initialProps: { value: 100 },
    });

    rerender({ value: 250 });

    expect(result.current).toBe(250);
    expect(gsapSpy).not.toHaveBeenCalled();
  });

  it('tweens towards the new value and lands exactly on it', async () => {
    const { result, rerender } = renderHook(({ value }) => useCountUp(value, { decimals: 4 }), {
      initialProps: { value: 0.8 },
    });

    rerender({ value: 0.9206 });
    await act(async () => {
      await new Promise<void>((resolve) => gsap.delayedCall(0.6, resolve));
    });

    expect(result.current).toBe(0.9206);
  });

  it('renders null for indicators that are not computable', () => {
    const { result, rerender } = renderHook(({ value }) => useCountUp(value), {
      initialProps: { value: 1.5 as number | null },
    });

    rerender({ value: null });

    expect(result.current).toBeNull();
  });
});
