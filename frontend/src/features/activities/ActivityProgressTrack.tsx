import gsap from 'gsap';
import { useLayoutEffect, useRef } from 'react';

import { MOTION_DURATION_SECONDS, MOTION_EASE } from '@/motion/constants';
import { prefersReducedMotion } from '@/motion/reduced-motion';

import { PROGRESS_TRACK_SIZE } from './activity-progress';

import type { ProgressTrackSize } from './activity-progress';

/** The real fill grows from nothing on first paint; both widths are reported percentages. */
const GROWN_SCALE_X = 1;
const EMPTY_SCALE_X = 0;

interface ActivityProgressTrackProps {
  plannedPercent: number;
  actualPercent: number;
  size?: ProgressTrackSize;
}

/**
 * Stacked progress bar: the planned percentage in grey and the real one in teal over it, so
 * being behind or ahead of the plan is a visible distance instead of two numbers to subtract.
 *
 * Purely graphic: it is hidden from assistive technology, and every place that uses it states
 * both percentages as text next to it.
 */
export function ActivityProgressTrack({
  plannedPercent,
  actualPercent,
  size = PROGRESS_TRACK_SIZE.ROW,
}: ActivityProgressTrackProps) {
  const fillRef = useRef<HTMLSpanElement>(null);

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
    <span
      aria-hidden="true"
      className={`relative block ${size} w-full overflow-hidden rounded-pill bg-surface-sunken`}
    >
      <span
        className="absolute inset-y-0 left-0 bg-line-strong transition-[width] duration-300"
        style={{ width: `${plannedPercent}%` }}
      />
      <span
        ref={fillRef}
        className="absolute inset-y-0 left-0 bg-accent-bright transition-[width] duration-300"
        style={{ width: `${actualPercent}%` }}
      />
    </span>
  );
}
