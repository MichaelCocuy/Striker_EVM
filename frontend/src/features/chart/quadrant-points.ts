import {
  COST_STATUS_LABEL,
  costStatusTone,
  EVM_TONE,
  SCHEDULE_STATUS_LABEL,
  scheduleStatusTone,
} from '@/evm/tone';

import { LABEL_MAX_CHARS } from './chart-config';
import { formatCompactMoney, truncateName } from './chart-format';
import { EMPTY_SCALE } from './nice-scale';
import {
  QUADRANT,
  quadrantAmountFontSize,
  quadrantNameY,
  quadrantPosition,
  quadrantRadius,
} from './quadrant-geometry';

import type { EvmActivityReport, EvmIndicators } from '@/api/types';
import type { EvmTone } from '@/evm/tone';

/**
 * Bubble model of the per-activity quadrant (handoff §3.5).
 *
 * Contract: both indices, the budget and both statuses come from the report. Placing a
 * bubble at the coordinates the reported CPI and SPI give it, and sizing it by the reported
 * budget, is presentation; no EVM indicator is derived here.
 *
 * An activity whose index is not computable has no coordinate at all, so it is left out of
 * the plot instead of being drawn at zero — and the card says how many were left out.
 */

export interface QuadrantPoint {
  id: string;
  name: string;
  /** Shortened name for the label above the bubble; the full one stays in the table. */
  label: string;
  /** Budget written inside the bubble, compact ("40 mil"). */
  amount: string;
  costPerformanceIndex: number;
  schedulePerformanceIndex: number;
  budgetAtCompletion: number;
  costStatusLabel: string;
  scheduleStatusLabel: string;
  tone: EvmTone;
  centerX: number;
  centerY: number;
  radius: number;
  nameY: number;
  amountFontSize: number;
  /** Drawn at the plot edge because its indices fall outside the scale. */
  isOffScale: boolean;
  /**
   * True when the bubble sits exactly on a reference line, where the dashes would cut
   * through its figure; those get a disc of card colour behind them.
   */
  hasHalo: boolean;
}

export interface QuadrantModel {
  points: QuadrantPoint[];
  /** Activities the report could not give both indices for, so they are not plotted. */
  notPlotted: string[];
  /** Activities drawn at the edge of the plot, whose position is approximate. */
  offScale: string[];
}

/**
 * Ink of a bubble, from the two statuses the report interpreted.
 *
 * Cost decides, because the bands of this plot are the CPI. The one downgrade is the case
 * the reviewer must not read as good news: money saved by not doing the work reads amber, as
 * `bubbleColorToken` of the portfolio quadrant also does. It differs from that rule only in
 * that a favourable cost with an on-target schedule stays favourable, which is how the
 * deliverable paints Diseño.
 */
export function activityTone(indicators: EvmIndicators): EvmTone {
  const cost = costStatusTone(indicators.costStatus);
  const schedule = scheduleStatusTone(indicators.scheduleStatus);

  if (cost === EVM_TONE.GOOD && schedule === EVM_TONE.BAD) {
    return EVM_TONE.NEUTRAL;
  }
  return cost;
}

/** Largest budget of the project; it sets the diameter of the biggest bubble. */
function largestBudget(activities: readonly EvmActivityReport[]): number {
  return Math.max(
    EMPTY_SCALE,
    ...activities.map((activity) => activity.indicators.budgetAtCompletion),
  );
}

export function toQuadrantModel(activities: readonly EvmActivityReport[]): QuadrantModel {
  const budgetReference = largestBudget(activities);
  const notPlotted: string[] = [];
  const points: QuadrantPoint[] = [];

  for (const activity of activities) {
    const { indicators } = activity;
    const cost = indicators.costPerformanceIndex;
    const schedule = indicators.schedulePerformanceIndex;
    if (cost === null || schedule === null) {
      notPlotted.push(activity.name);
      continue;
    }

    const radius = quadrantRadius(indicators.budgetAtCompletion, budgetReference);
    const position = quadrantPosition(cost, schedule, radius);

    points.push({
      ...position,
      id: activity.id,
      name: activity.name,
      label: truncateName(activity.name, LABEL_MAX_CHARS),
      amount: formatCompactMoney(indicators.budgetAtCompletion),
      costPerformanceIndex: cost,
      schedulePerformanceIndex: schedule,
      budgetAtCompletion: indicators.budgetAtCompletion,
      costStatusLabel: COST_STATUS_LABEL[indicators.costStatus],
      scheduleStatusLabel: SCHEDULE_STATUS_LABEL[indicators.scheduleStatus],
      tone: activityTone(indicators),
      radius,
      nameY: quadrantNameY(position.centerY, radius),
      amountFontSize: quadrantAmountFontSize(radius),
      hasHalo:
        position.centerX === QUADRANT.REFERENCE_X || position.centerY === QUADRANT.REFERENCE_Y,
    });
  }

  return {
    points,
    notPlotted,
    offScale: points.filter((point) => point.isOffScale).map((point) => point.name),
  };
}
