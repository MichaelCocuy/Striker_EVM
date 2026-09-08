import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';

import { MOTION_DURATION_SECONDS, MOTION_EASE } from '@/motion/constants';
import { usePrefersReducedMotion } from '@/motion/reduced-motion';

const EMPTY_ARC = 0;

/**
 * Fraction of the gauge arc that is painted. It sweeps from empty on first render and from
 * the previous value when the report is recalculated; under reduced motion the final state is
 * returned straight away. Recharts cannot animate a hand-rolled SVG arc, hence GSAP here.
 */
export function useArcSweep(
  fraction: number,
  durationSeconds: number = MOTION_DURATION_SECONDS.SLOW,
): number {
  const isReducedMotion = usePrefersReducedMotion();
  const [sweptFraction, setSweptFraction] = useState(EMPTY_ARC);
  const previousFractionRef = useRef(EMPTY_ARC);

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
