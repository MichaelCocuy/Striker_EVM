import gsap from 'gsap';
import { useLayoutEffect } from 'react';

import { MOTION_DURATION_SECONDS, MOTION_EASE } from './constants';
import { prefersReducedMotion } from './reduced-motion';

import type { RefObject } from 'react';

/** CSS custom property the element reads its colors from, e.g. `background: var(--status-color)`. */
export const STATUS_COLOR_VARIABLE = '--status-color';
export const STATUS_SOFT_COLOR_VARIABLE = '--status-soft-color';

export interface StatusColors {
  /** Token names such as `--evm-good`; they are resolved against the document root. */
  colorToken: string;
  softColorToken: string;
}

function resolveToken(token: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}

/**
 * Tweens the element's status colors (a custom property pair) towards the given tokens
 * so traffic-light changes cross-fade instead of blinking. Reduced motion applies instantly.
 */
export function useStatusColorTween<TElement extends HTMLElement>(
  elementRef: RefObject<TElement | null>,
  { colorToken, softColorToken }: StatusColors,
): void {
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (element === null) {
      return;
    }
    const target = {
      [STATUS_COLOR_VARIABLE]: resolveToken(colorToken),
      [STATUS_SOFT_COLOR_VARIABLE]: resolveToken(softColorToken),
    };
    if (prefersReducedMotion() || element.style.getPropertyValue(STATUS_COLOR_VARIABLE) === '') {
      gsap.set(element, target);
      return;
    }
    const tween = gsap.to(element, {
      ...target,
      duration: MOTION_DURATION_SECONDS.BASE,
      ease: MOTION_EASE.COLOR,
    });
    return () => {
      tween.kill();
    };
  }, [elementRef, colorToken, softColorToken]);
}
