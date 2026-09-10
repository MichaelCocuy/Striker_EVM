import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';

import { MOTION_DURATION_SECONDS, MOTION_EASE } from './constants';
import { usePrefersReducedMotion } from './reduced-motion';

/** A shape that is not drawn at all; where every sweep starts. */
const EMPTY_FRACTION = 0;

/**
 * Fraction of a shape that is drawn, tweened towards `fraction`: it sweeps from empty on
 * first render and from the previous value when the report is recalculated, and under reduced
 * motion the final state is returned straight away.
 *
 * Shared by the gauge arc and by the bars of the explanatory cards; Recharts cannot animate a
 * hand-rolled SVG arc, hence GSAP here. It returns the fraction on every frame, so use it where
 * the value itself has to be painted (an SVG `stroke-dasharray`, a computed width) and prefer
 * tweening the element directly where a re-render per frame would be wasteful.
 */
export function useFractionSweep(
  fraction: number,
  durationSeconds: number = MOTION_DURATION_SECONDS.SLOW,
): number {
  const isReducedMotion = usePrefersReducedMotion();
  const [sweptFraction, setSweptFraction] = useState(EMPTY_FRACTION);
  const previousFractionRef = useRef(EMPTY_FRACTION);

  useEffect(() => {
    const from = previousFractionRef.current;
    previousFractionRef.current = fraction;
    if (isReducedMotion) {
      return;
    }

    const proxy = { fraction: from };
    const tween = gsap.to(proxy, {
      fraction,
      duration: durationSeconds,
      ease: MOTION_EASE.ENTER,
      onUpdate: () => setSweptFraction(proxy.fraction),
      onComplete: () => setSweptFraction(fraction),
    });
    return () => {
      tween.kill();
    };
  }, [fraction, durationSeconds, isReducedMotion]);

  return isReducedMotion ? fraction : sweptFraction;
}
