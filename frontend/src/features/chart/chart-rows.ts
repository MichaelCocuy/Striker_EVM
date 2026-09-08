import { AXIS_NAME_MAX_CHARS, SERIES_KEYS } from './chart-config';
import { truncateName } from './chart-format';

import type { EvmActivityReport } from '@/api/types';

/**
 * One row per activity: the three money series the bars plot, plus the identity and the two
 * indices the tooltip explains the bars with. Every number is copied from the report; the
 * chart never derives an EVM value.
 */
export interface ChartRow {
  id: string;
  name: string;
  /** Truncated name used as the x axis tick. */
  tick: string;
  [SERIES_KEYS.PLANNED_VALUE]: number;
  [SERIES_KEYS.EARNED_VALUE]: number;
  [SERIES_KEYS.ACTUAL_COST]: number;
  costPerformanceIndex: number | null;
  schedulePerformanceIndex: number | null;
}

export function toChartRows(activities: readonly EvmActivityReport[]): ChartRow[] {
  return activities.map((activity) => ({
    id: activity.id,
    name: activity.name,
    tick: truncateName(activity.name, AXIS_NAME_MAX_CHARS),
    [SERIES_KEYS.PLANNED_VALUE]: activity.indicators.plannedValue,
    [SERIES_KEYS.EARNED_VALUE]: activity.indicators.earnedValue,
    [SERIES_KEYS.ACTUAL_COST]: activity.indicators.actualCost,
    costPerformanceIndex: activity.indicators.costPerformanceIndex,
    schedulePerformanceIndex: activity.indicators.schedulePerformanceIndex,
  }));
}
