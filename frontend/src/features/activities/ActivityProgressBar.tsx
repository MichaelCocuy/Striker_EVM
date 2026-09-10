import gsap from 'gsap';
import { useLayoutEffect, useRef } from 'react';

import { formatMoney, formatPercent } from '@/lib/format';
import { MOTION_DURATION_SECONDS, MOTION_EASE } from '@/motion/constants';
import { prefersReducedMotion } from '@/motion/reduced-motion';

import type { ActivityMeasures, EvmIndicators } from '@/api/types';

const COPY = {
  ACTUAL: 'Avance real',
  PLANNED: 'Avance planificado',
  /** BAC and PV have no column of their own; this cell is where they stay readable. */
  BUDGET_AT_COMPLETION: 'Presupuesto total (BAC)',
  PLANNED_VALUE: 'Valor planificado (PV)',
  SEPARATOR: ' · ',
} as const;

/**
 * The fill grows from nothing on first render; later values slide with a CSS transition.
 *
 * This tweens the element directly instead of using `motion/useFractionSweep`, which returns the
 * fraction on every frame: that hook is right for an SVG arc whose path has to be recomputed,
 * but a table renders one bar per row and re-rendering all of them on every frame would be
 * wasteful when a transform does the same job on the compositor.
 */
const GROWN_SCALE_X = 1;
const EMPTY_SCALE_X = 0;

interface ActivityProgressBarProps {
  input: ActivityMeasures;
  indicators: EvmIndicators;
}

/** Everything the cell shows plus the two money columns the mockup dropped. */
function progressReading({ input, indicators }: ActivityProgressBarProps): string {
  return [
    `${COPY.ACTUAL} ${formatPercent(input.actualProgressPercent)}`,
    `${COPY.PLANNED} ${formatPercent(input.plannedProgressPercent)}`,
    `${COPY.BUDGET_AT_COMPLETION} ${formatMoney(indicators.budgetAtCompletion)}`,
    `${COPY.PLANNED_VALUE} ${formatMoney(indicators.plannedValue)}`,
  ].join(COPY.SEPARATOR);
}

/**
 * Real progress as a bar with a marker at the planned progress, so being behind or ahead is a
 * visible distance instead of two numbers to subtract.
 *
 * Both percentages come from the report; the bar only paints them. The whole reading, BAC and
 * PV included, is exposed as text for screen readers and as the bar's tooltip for everyone
 * else, because those two numbers no longer have a column of their own.
 */
export function ActivityProgressBar({ input, indicators }: ActivityProgressBarProps) {
  const fillRef = useRef<HTMLSpanElement>(null);
  const reading = progressReading({ input, indicators });

  useLayoutEffect(() => {
    const fill = fillRef.current;
    if (fill === null) {
      return;
    }
    if (prefersReducedMotion()) {
      gsap.set(fill, { scaleX: GROWN_SCALE_X });
      return;
    }
    const tween = gsap.fromTo(
      fill,
      { scaleX: EMPTY_SCALE_X },
      {
        scaleX: GROWN_SCALE_X,
        transformOrigin: 'left center',
        duration: MOTION_DURATION_SECONDS.SLOW,
        ease: MOTION_EASE.ENTER,
      },
    );
    return () => {
      tween.kill();
    };
  }, []);

  return (
    <span className="flex flex-1 items-center gap-3">
      <span className="sr-only">{reading}</span>
      <span
        aria-hidden="true"
        title={reading}
        className="relative h-2 min-w-16 flex-1 rounded-pill bg-surface-sunken"
      >
        <span
          ref={fillRef}
          className="absolute inset-y-0 left-0 rounded-pill bg-accent transition-[width] duration-300"
          style={{ width: `${input.actualProgressPercent}%` }}
        />
        <span
          className="absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-pill bg-ink"
          style={{ left: `${input.plannedProgressPercent}%` }}
        />
      </span>
      <span aria-hidden="true" className="numeric w-11 shrink-0 text-right text-ink">
        {formatPercent(input.actualProgressPercent)}
      </span>
    </span>
  );
}
