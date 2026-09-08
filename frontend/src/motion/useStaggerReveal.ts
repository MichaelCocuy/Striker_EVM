import gsap from 'gsap';
import { useLayoutEffect } from 'react';

import {
  MOTION_DURATION_SECONDS,
  MOTION_EASE,
  MOTION_OFFSET_PX,
  MOTION_STAGGER_SECONDS,
  REVEAL_SELECTOR,
} from './constants';
import { prefersReducedMotion } from './reduced-motion';

import type { RefObject } from 'react';

export interface StaggerRevealOptions {
  /** CSS selector for the children to reveal; defaults to `[data-reveal]`. */
  selector?: string;
  /** Re-run the reveal when this value changes (e.g. a list length or a report id). */
  revealKey?: string | number;
}

/**
 * Reveals the matching descendants of `containerRef` one after another
 * (cards, table rows). Under reduced motion they are shown at once.
 */
export function useStaggerReveal<TElement extends HTMLElement>(
  containerRef: RefObject<TElement | null>,
  { selector = REVEAL_SELECTOR, revealKey }: StaggerRevealOptions = {},
): void {
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (container === null) {
      return;
    }
    const targets = Array.from(container.querySelectorAll<HTMLElement>(selector));
    if (targets.length === 0) {
      return;
    }
    const finalState = { autoAlpha: 1, y: 0 };
    if (prefersReducedMotion()) {
      gsap.set(targets, finalState);
      return;
    }
    const tween = gsap.fromTo(
      targets,
      { autoAlpha: 0, y: MOTION_OFFSET_PX.REVEAL_Y },
      {
        ...finalState,
        duration: MOTION_DURATION_SECONDS.BASE,
        ease: MOTION_EASE.ENTER,
        stagger: MOTION_STAGGER_SECONDS,
      },
    );
    return () => {
      tween.kill();
    };
  }, [containerRef, selector, revealKey]);
}
