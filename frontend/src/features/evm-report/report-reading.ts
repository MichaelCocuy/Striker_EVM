import { COST_STATUS, SCHEDULE_STATUS } from '@/api/types';
import { EVM_TONE, EVM_TONE_LABEL } from '@/evm/tone';

import type { SignReading } from './indicator-copy';
import type { EvmIndicators } from '@/api/types';
import type { EvmTone } from '@/evm/tone';

/**
 * Presentation-only interpretation of what the report already computed, shared by the
 * reading band and the charts.
 *
 * Nothing here derives an EVM indicator: a reported figure is only compared with zero (or
 * checked for `null`) to choose the wording and the traffic-light tone that go with it,
 * exactly as docs/EVM_GUIA.md §3 reads the signs.
 */

export const VARIANCE_SIGN = {
  POSITIVE: 'POSITIVE',
  ZERO: 'ZERO',
  NEGATIVE: 'NEGATIVE',
} as const satisfies Record<keyof SignReading, keyof SignReading>;

export type VarianceSign = (typeof VARIANCE_SIGN)[keyof typeof VARIANCE_SIGN];

const VARIANCE_SIGN_TONE: Record<VarianceSign, EvmTone> = {
  [VARIANCE_SIGN.POSITIVE]: EVM_TONE.GOOD,
  [VARIANCE_SIGN.ZERO]: EVM_TONE.NEUTRAL,
  [VARIANCE_SIGN.NEGATIVE]: EVM_TONE.BAD,
};

export interface FigureReading {
  tone: EvmTone;
  label: string;
}

const ZERO = 0;

function signOf(value: number): VarianceSign {
  if (value > ZERO) {
    return VARIANCE_SIGN.POSITIVE;
  }
  if (value < ZERO) {
    return VARIANCE_SIGN.NEGATIVE;
  }
  return VARIANCE_SIGN.ZERO;
}

/** Turns the sign of a reported figure into its reading; `null` reads as "no aplica". */
export function readSign(value: number | null, wording: SignReading): FigureReading {
  if (value === null) {
    return { tone: EVM_TONE.NA, label: EVM_TONE_LABEL[EVM_TONE.NA] };
  }
  const sign = signOf(value);
  return { tone: VARIANCE_SIGN_TONE[sign], label: wording[sign] };
}

/**
 * True when the report says there is nothing to evaluate yet: no money anywhere, no
 * computable index and both traffic lights off (docs/EVM_GUIA.md §5.5). It reads the
 * reported fields as they come; it does not recompute them.
 */
export function isNothingToEvaluate(indicators: EvmIndicators): boolean {
  return (
    indicators.budgetAtCompletion === ZERO &&
    indicators.plannedValue === ZERO &&
    indicators.earnedValue === ZERO &&
    indicators.actualCost === ZERO &&
    indicators.costPerformanceIndex === null &&
    indicators.schedulePerformanceIndex === null &&
    indicators.costStatus === COST_STATUS.NOT_APPLICABLE &&
    indicators.scheduleStatus === SCHEDULE_STATUS.NOT_APPLICABLE
  );
}
