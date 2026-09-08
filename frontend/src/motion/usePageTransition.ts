import gsap from 'gsap';
import { useLayoutEffect, useRef } from 'react';

import { MOTION_DURATION_SECONDS, MOTION_EASE, MOTION_OFFSET_PX } from './constants';
import { prefersReducedMotion } from './reduced-motion';

import type { RefObject } from 'react';

/**
 * Fades and slides the referenced element in every time `transitionKey` changes
 * (typically the current pathname). Under reduced motion the element is shown immediately.
 */
export function usePageTransition<TElement extends HTMLElement>(
  transitionKey: string,
): RefObject<TElement> {
  const elementRef = useRef<TElement>(null);

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (element === null) {
      return;
    }
    const finalState = { autoAlpha: 1, y: 0 };
    if (prefersReducedMotion()) {
      gsap.set(element, finalState);
      return;
    }
    const tween = gsap.fromTo(
      element,
      { autoAlpha: 0, y: MOTION_OFFSET_PX.PAGE_ENTER_Y },
      { ...finalState, duration: MOTION_DURATION_SECONDS.BASE, ease: MOTION_EASE.ENTER },
    );
    return () => {
      tween.kill();
    };
  }, [transitionKey]);

  return elementRef;
}
