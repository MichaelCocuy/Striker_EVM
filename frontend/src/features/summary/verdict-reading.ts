import { formatMoney } from '@/lib/format';

import { SUMMARY_COPY } from './summary-copy';
import { isNothingToEvaluate, readSign } from './summary-reading';
import {
  COMPLETION_GAP_READING,
  CONSEQUENCE_COPY,
  VERDICT_BY_STATUS,
  VERDICT_LEVEL,
  VERDICT_LEVEL_TONE,
} from './verdict-copy';

import type { VerdictLevel } from './verdict-copy';
import type { EvmIndicators } from '@/api/types';
import type { EvmTone } from '@/evm/tone';

/**
 * Presentation-only reading of the verdict band.
 *
 * It looks up wording by the pair of statuses the report brings and reads the sign of the
 * figures it already computed. No EVM indicator is derived here: the only arithmetic is
 * dropping the minus sign of a variance whose direction is already spelled out in words.
 */

/** The whole band in one object, so the component renders and does not decide. */
export interface VerdictReading {
  level: VerdictLevel;
  tone: EvmTone;
  /** The one-line answer, the largest thing on the band. */
  headline: string;
  /** The consequence in money, or the reason there is none to show. */
  detail: string;
  /** False when the report has nothing to evaluate: the tiles would only show dashes. */
  hasAnswers: boolean;
}

/** Magnitude of a figure whose direction is already read in words ("5.172,41 por encima"). */
function magnitudeOf(value: number): number {
  return Math.abs(value);
}

function readForecastReason(costPerformanceIndex: number | null): string {
  if (costPerformanceIndex === null) {
    return CONSEQUENCE_COPY.NO_COST_REASON;
  }
  if (costPerformanceIndex === 0) {
    return CONSEQUENCE_COPY.NO_PROGRESS_REASON;
  }
  return CONSEQUENCE_COPY.NOT_COMPUTABLE_REASON;
}

/**
 * What the verdict costs at the closing, in one sentence: what the project will end up
 * costing against its budget and by how much it misses it. When the report could not
 * compute EAC it says why instead of showing dashes (docs/EVM_GUIA.md §5).
 */
export function readConsequence(indicators: EvmIndicators): string {
  const { estimateAtCompletion, budgetAtCompletion, varianceAtCompletion } = indicators;

  if (estimateAtCompletion === null) {
    return readForecastReason(indicators.costPerformanceIndex);
  }

  const forecast = `${CONSEQUENCE_COPY.FORECAST_LEAD} ${formatMoney(estimateAtCompletion)}`;

  if (varianceAtCompletion === null) {
    return `${forecast} ${CONSEQUENCE_COPY.BUDGET_REFERENCE} ${formatMoney(budgetAtCompletion)}.`;
  }

  const gap = readSign(varianceAtCompletion, COMPLETION_GAP_READING);

  if (varianceAtCompletion === 0) {
    return `${forecast}: ${gap.label}.`;
  }

  const missedBy = formatMoney(magnitudeOf(varianceAtCompletion));
  return `${forecast} ${CONSEQUENCE_COPY.INSTEAD_OF} ${formatMoney(budgetAtCompletion)}: ${missedBy} ${gap.label}.`;
}

/**
 * The verdict of the project: the sentence that answers how it is going, the tone that
 * signals it before the sentence is read, and the consequence in money.
 */
export function readVerdict(indicators: EvmIndicators): VerdictReading {
  if (isNothingToEvaluate(indicators)) {
    return {
      level: VERDICT_LEVEL.UNKNOWN,
      tone: VERDICT_LEVEL_TONE[VERDICT_LEVEL.UNKNOWN],
      headline: SUMMARY_COPY.EMPTY_HEADING,
      detail: SUMMARY_COPY.EMPTY_BODY,
      hasAnswers: false,
    };
  }

  const { level, headline } = VERDICT_BY_STATUS[indicators.costStatus][indicators.scheduleStatus];
  return {
    level,
    tone: VERDICT_LEVEL_TONE[level],
    headline,
    detail: readConsequence(indicators),
    hasAnswers: true,
  };
}
