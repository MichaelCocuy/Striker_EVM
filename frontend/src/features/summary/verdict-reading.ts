import { isNothingToEvaluate } from '@/features/evm-report/report-reading';

import { readDeviationFocus } from './deviation-focus';
import {
  EMPTY_READING_COPY,
  FORECAST_REASON_COPY,
  VERDICT_BY_STATUS,
  VERDICT_LEVEL,
} from './verdict-copy';

import type { VerdictLevel } from './verdict-copy';
import type { EvmActivityReport, EvmIndicators } from '@/api/types';

/**
 * Presentation-only reading of the band.
 *
 * It looks up the sentence by the pair of statuses the report brings and names the activity
 * that carries the deviation at closing. No EVM indicator is derived here.
 */

/** The conclusion cell in one object, so the component renders and does not decide. */
export interface BandReading {
  level: VerdictLevel;
  /** The one-line answer, the largest thing on the band. */
  headline: string;
  /** Where the deviation sits, or why there is nothing to evaluate. */
  detail: string;
  /** False when the report has nothing to evaluate: the gauges would only show dashes. */
  hasAnswers: boolean;
}

const NO_EFFICIENCY = 0;

/**
 * The sentence that answers how the project is going, plus the line that says where to
 * intervene. A project with no activities gets the plain "nothing to evaluate" reading
 * instead of a band full of dashes.
 */
export function readBand(
  indicators: EvmIndicators,
  activities: readonly EvmActivityReport[],
): BandReading {
  if (isNothingToEvaluate(indicators)) {
    return {
      level: VERDICT_LEVEL.UNKNOWN,
      headline: EMPTY_READING_COPY.HEADING,
      detail: EMPTY_READING_COPY.BODY,
      hasAnswers: false,
    };
  }

  const { level, headline } = VERDICT_BY_STATUS[indicators.costStatus][indicators.scheduleStatus];
  return {
    level,
    headline,
    detail: readDeviationFocus(indicators, activities),
    hasAnswers: true,
  };
}

/**
 * Why the closing cost cannot be projected, or `null` when the report did project it. The
 * forecast cell says the reason instead of leaving two dashes without explanation.
 */
export function readForecastReason(indicators: EvmIndicators): string | null {
  if (indicators.estimateAtCompletion !== null) {
    return null;
  }
  if (indicators.costPerformanceIndex === null) {
    return FORECAST_REASON_COPY.NO_COST;
  }
  if (indicators.costPerformanceIndex === NO_EFFICIENCY) {
    return FORECAST_REASON_COPY.NO_PROGRESS;
  }
  return FORECAST_REASON_COPY.NOT_COMPUTABLE;
}
