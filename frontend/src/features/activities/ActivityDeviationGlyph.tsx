import { useRef } from 'react';

import { EVM_TONE_TOKENS } from '@/evm/tone';
import { STATUS_COLOR_VARIABLE, useStatusColorTween } from '@/motion/useStatusColorTween';

import { DEVIATION_DIRECTION } from './activity-deviation';

import type { ActivityDeviation, DeviationDirection } from './activity-deviation';

/** Geometry of the two-point line, in the glyph's own viewBox units. */
const GLYPH = {
  WIDTH: 28,
  HEIGHT: 14,
  START_X: 3,
  END_X: 25,
  TOP_Y: 3,
  MIDDLE_Y: 7,
  BOTTOM_Y: 11,
  DOT_RADIUS: 2.2,
  STROKE_WIDTH: 2,
} as const;

interface GlyphEndpoints {
  startY: number;
  endY: number;
}

/** Rising when the real progress is above the plan, falling when below, flat when they match. */
const DIRECTION_ENDPOINTS: Record<DeviationDirection, GlyphEndpoints> = {
  [DEVIATION_DIRECTION.ABOVE]: { startY: GLYPH.BOTTOM_Y, endY: GLYPH.TOP_Y },
  [DEVIATION_DIRECTION.ON_PLAN]: { startY: GLYPH.MIDDLE_Y, endY: GLYPH.MIDDLE_Y },
  [DEVIATION_DIRECTION.BELOW]: { startY: GLYPH.TOP_Y, endY: GLYPH.BOTTOM_Y },
};

interface ActivityDeviationGlyphProps {
  deviation: ActivityDeviation;
}

/**
 * The plan-to-real deviation as a sloped line in the tone of its direction, plus the same
 * reading as text: a line says nothing to a screen reader.
 */
export function ActivityDeviationGlyph({ deviation }: ActivityDeviationGlyphProps) {
  const toneRef = useRef<HTMLSpanElement>(null);
  useStatusColorTween(toneRef, EVM_TONE_TOKENS[deviation.tone]);
  const { startY, endY } = DIRECTION_ENDPOINTS[deviation.direction];

  return (
    <span
      ref={toneRef}
      data-tone={deviation.tone}
      data-direction={deviation.direction}
      className="inline-flex items-center"
      style={{ color: `var(${STATUS_COLOR_VARIABLE})` }}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        width={GLYPH.WIDTH}
        height={GLYPH.HEIGHT}
        viewBox={`0 0 ${GLYPH.WIDTH} ${GLYPH.HEIGHT}`}
      >
        <line
          x1={GLYPH.START_X}
          y1={startY}
          x2={GLYPH.END_X}
          y2={endY}
          stroke="currentColor"
          strokeWidth={GLYPH.STROKE_WIDTH}
          strokeLinecap="round"
        />
        <circle cx={GLYPH.START_X} cy={startY} r={GLYPH.DOT_RADIUS} fill="currentColor" />
        <circle cx={GLYPH.END_X} cy={endY} r={GLYPH.DOT_RADIUS} fill="currentColor" />
      </svg>
      <span className="sr-only">{deviation.reading}</span>
    </span>
  );
}
