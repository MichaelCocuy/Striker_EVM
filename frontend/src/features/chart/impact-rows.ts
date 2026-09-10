import { costStatusTone, COST_STATUS_LABEL } from '@/evm/tone';

import type { EvmActivityReport } from '@/api/types';
import type { EvmTone } from '@/evm/tone';

/**
 * Row model of the deviation focus (module M11): the activities of the report ordered by the
 * cost variance they contribute, worst first.
 *
 * Contract: the variance, the index and the status all come from the report. Sorting by a
 * number, reading its sign and taking its magnitude to size a bar is presentation; no EVM
 * indicator is derived here.
 */

const ZERO_VARIANCE = 0;

export const IMPACT_COPY = {
  /** Names the activity that concentrates the deviation, so the reviewer starts there. */
  FOCUS: (name: string) => `El sobrecosto se concentra en ${name}.`,
  NO_DEVIATION: 'Ninguna actividad tiene sobrecosto: no hay desviación de costo que explicar.',
  CPI: 'CPI',
} as const;

export interface ImpactRow {
  id: string;
  name: string;
  /** Cost variance the report brings for the activity. */
  costVariance: number;
  costPerformanceIndex: number | null;
  /** Traffic light of the cost status the report brings. */
  tone: EvmTone;
  /** Interpretation the report brings, e.g. `Sobre presupuesto`. */
  statusLabel: string;
  /** A negative variance is money lost, and the bar grows to the left of the zero axis. */
  isNegative: boolean;
}

/** Worst first: the most negative variance heads the list, the most favourable closes it. */
export function toImpactRows(activities: readonly EvmActivityReport[]): ImpactRow[] {
  return activities
    .map((activity) => ({
      id: activity.id,
      name: activity.name,
      costVariance: activity.indicators.costVariance,
      costPerformanceIndex: activity.indicators.costPerformanceIndex,
      tone: costStatusTone(activity.indicators.costStatus),
      statusLabel: COST_STATUS_LABEL[activity.indicators.costStatus],
      isNegative: activity.indicators.costVariance < ZERO_VARIANCE,
    }))
    .sort((left, right) => left.costVariance - right.costVariance);
}

/** Largest deviation in either direction: it sets the 100 % of each side of the axis. */
export function impactScale(rows: readonly ImpactRow[]): number {
  return Math.max(...rows.map((row) => Math.abs(row.costVariance)), ZERO_VARIANCE);
}

/**
 * One line of conclusion. Rows arrive worst first, so the first one is the activity that
 * concentrates the deviation — unless it is not in the red, in which case there is none.
 */
export function toImpactConclusion(rows: readonly ImpactRow[]): string {
  const worst = rows[0];
  if (worst === undefined || !worst.isNegative) {
    return IMPACT_COPY.NO_DEVIATION;
  }
  return IMPACT_COPY.FOCUS(worst.name);
}
