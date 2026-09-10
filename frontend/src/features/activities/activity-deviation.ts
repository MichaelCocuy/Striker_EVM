import { EVM_TONE } from '@/evm/tone';
import { formatPercent } from '@/lib/format';

import type { ActivityMeasures } from '@/api/types';
import type { EvmTone } from '@/evm/tone';

/** Where the real progress sits with respect to the planned one at the cut-off date. */
export const DEVIATION_DIRECTION = {
  ABOVE: 'above',
  ON_PLAN: 'on-plan',
  BELOW: 'below',
} as const;

export type DeviationDirection = (typeof DEVIATION_DIRECTION)[keyof typeof DEVIATION_DIRECTION];

/** Same traffic light as the rest of the app: ahead is green, on plan amber, behind red. */
const DIRECTION_TONE: Record<DeviationDirection, EvmTone> = {
  [DEVIATION_DIRECTION.ABOVE]: EVM_TONE.GOOD,
  [DEVIATION_DIRECTION.ON_PLAN]: EVM_TONE.NEUTRAL,
  [DEVIATION_DIRECTION.BELOW]: EVM_TONE.BAD,
};

const COPY = {
  READING: {
    [DEVIATION_DIRECTION.ABOVE]: 'Por encima del plan',
    [DEVIATION_DIRECTION.ON_PLAN]: 'Igual al plan',
    [DEVIATION_DIRECTION.BELOW]: 'Por debajo del plan',
  },
  COMPARISON: (actual: string, planned: string) =>
    `avance real ${actual} frente al ${planned} planificado a la fecha de corte`,
} as const;

export interface ActivityDeviation {
  direction: DeviationDirection;
  tone: EvmTone;
  /** Full sentence, for the glyph's hidden text and its tooltip. */
  reading: string;
}

function directionOf({
  plannedProgressPercent,
  actualProgressPercent,
}: ActivityMeasures): DeviationDirection {
  if (actualProgressPercent > plannedProgressPercent) {
    return DEVIATION_DIRECTION.ABOVE;
  }
  if (actualProgressPercent < plannedProgressPercent) {
    return DEVIATION_DIRECTION.BELOW;
  }
  return DEVIATION_DIRECTION.ON_PLAN;
}

/**
 * Reads the two progress percentages the report brings for the same cut-off date and says
 * which side of the plan the activity is on.
 *
 * This is presentation, like picking a tone from a status: nothing is computed from the
 * measures beyond comparing them, and no EVM indicator is derived here.
 */
export function activityDeviation(input: ActivityMeasures): ActivityDeviation {
  const direction = directionOf(input);
  return {
    direction,
    tone: DIRECTION_TONE[direction],
    reading: `${COPY.READING[direction]}: ${COPY.COMPARISON(
      formatPercent(input.actualProgressPercent),
      formatPercent(input.plannedProgressPercent),
    )}`,
  };
}
