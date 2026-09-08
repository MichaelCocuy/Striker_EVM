import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';

import { MOTION_DURATION_SECONDS, MOTION_EASE } from './constants';
import { prefersReducedMotion } from './reduced-motion';

export interface CountUpOptions {
  /** Decimal places kept while animating so the number never flickers in width. */
  decimals?: number;
  durationSeconds?: number;
}

const DEFAULT_DECIMALS = 0;
const DECIMAL_BASE = 10;

function roundTo(value: number, decimals: number): number {
  const factor = DECIMAL_BASE ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Animates from the previously displayed number towards `value` and returns the
 * intermediate number to render. `null` renders as null (not computable indicators).
 */
export function useCountUp(
  value: number | null,
  {
    decimals = DEFAULT_DECIMALS,
    durationSeconds = MOTION_DURATION_SECONDS.SLOW,
  }: CountUpOptions = {},
): number | null {
  const [displayValue, setDisplayValue] = useState<number | null>(value);
  const lastValueRef = useRef<number | null>(value);

  useEffect(() => {
    const from = lastValueRef.current;
    lastValueRef.current = value;

    if (value === null || from === null || prefersReducedMotion()) {
      setDisplayValue(value);
      return;
    }

    const proxy = { current: from };
    const tween = gsap.to(proxy, {
      current: value,
      duration: durationSeconds,
      ease: MOTION_EASE.NUMBER,
      onUpdate: () => setDisplayValue(roundTo(proxy.current, decimals)),
      onComplete: () => setDisplayValue(value),
    });
    return () => {
      tween.kill();
    };
  }, [value, decimals, durationSeconds]);

  return displayValue;
}
