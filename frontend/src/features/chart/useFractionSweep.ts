import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';

import { MOTION_DURATION_SECONDS, MOTION_EASE } from '@/motion/constants';
import { usePrefersReducedMotion } from '@/motion/reduced-motion';

import { EMPTY_FRACTION } from './bar-scale';

/**
 * Fraction of a shape that is drawn, tweened towards `fraction`: it sweeps from empty on
 * first render and from the previous value when the report is recalculated, and under reduced
 * motion the final state is returned straight away.
 *
 * Shared by the gauge arc and by the bars of the two explanatory cards; Recharts cannot
 * animate a hand-rolled SVG arc or an HTML box, hence GSAP here.
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
