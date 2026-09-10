import { SERIES_KEYS } from './chart-config';
import { EMPTY_SCALE } from './nice-scale';

import type { EvmActivityReport } from '@/api/types';

/**
 * Row model of the per-activity PV / EV / AC bars (handoff §3.4).
 *
 * Every number is copied from the report: the three money series, the budget the vertical
 * marker sits on, and the two indices the hidden table repeats. Nothing is derived.
 */
export interface ActivityBarRow {
  id: string;
  name: string;
  [SERIES_KEYS.PLANNED_VALUE]: number;
  [SERIES_KEYS.EARNED_VALUE]: number;
  [SERIES_KEYS.ACTUAL_COST]: number;
  budgetAtCompletion: number;
  costPerformanceIndex: number | null;
  schedulePerformanceIndex: number | null;
}

export function toActivityBarRows(activities: readonly EvmActivityReport[]): ActivityBarRow[] {
  return activities.map((activity) => ({
    id: activity.id,
    name: activity.name,
    [SERIES_KEYS.PLANNED_VALUE]: activity.indicators.plannedValue,
    [SERIES_KEYS.EARNED_VALUE]: activity.indicators.earnedValue,
    [SERIES_KEYS.ACTUAL_COST]: activity.indicators.actualCost,
    budgetAtCompletion: activity.indicators.budgetAtCompletion,
    costPerformanceIndex: activity.indicators.costPerformanceIndex,
    schedulePerformanceIndex: activity.indicators.schedulePerformanceIndex,
  }));
}

/**
 * Largest figure the plot has to fit: the three series plus the budget marker, which would
 * otherwise fall outside the axis for an activity that is under budget.
 */
export function activityBarsMax(rows: readonly ActivityBarRow[]): number {
  return Math.max(
    EMPTY_SCALE,
    ...rows.flatMap((row) => [
      row[SERIES_KEYS.PLANNED_VALUE],
      row[SERIES_KEYS.EARNED_VALUE],
      row[SERIES_KEYS.ACTUAL_COST],
      row.budgetAtCompletion,
    ]),
  );
}
