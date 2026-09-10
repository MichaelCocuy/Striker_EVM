import { COST_STATUS, SCHEDULE_STATUS } from '@/api/types';
import { costStatusTone, scheduleStatusTone } from '@/evm/tone';
import { formatMoney } from '@/lib/format';

import { SERIES_COLOR_TOKEN, SERIES_KEYS } from './chart-config';

import type { SeriesKey } from './chart-config';
import type { CostStatus, EvmIndicators, ScheduleStatus } from '@/api/types';
import type { EvmTone } from '@/evm/tone';

/**
 * Row model of the PV / EV / AC comparison (docs/EVM_GUIA.md §2), in the reading order of the
 * house analogy: what I should have built, what I did build, what I paid.
 *
 * Contract: every number is copied from the report. Taking the absolute value of a variance
 * the report already brought is presentation (the sign is what the wording says), and no EVM
 * indicator is derived here.
 */

export const COMPARISON_SERIES = {
  PLANNED: { label: 'Debía llevar hecho', acronym: 'PV' },
  EARNED: { label: 'Llevo hecho', acronym: 'EV' },
  ACTUAL: { label: 'He pagado', acronym: 'AC' },
} as const;

/** Reading of a gap: the amount is the variance the report brought, already formatted. */
type GapReading = (amount: string) => string;

const { PLANNED, EARNED, ACTUAL } = COMPARISON_SERIES;

/** How the distance between EV and PV reads, per schedule status of the report. */
const SCHEDULE_GAP_READING: Record<ScheduleStatus, GapReading> = {
  [SCHEDULE_STATUS.BEHIND_SCHEDULE]: (amount) =>
    `Atraso de ${amount}: falta trabajo para llegar a ${PLANNED.acronym}`,
  [SCHEDULE_STATUS.AHEAD_OF_SCHEDULE]: (amount) =>
    `Adelanto de ${amount}: hay más trabajo hecho que ${PLANNED.acronym}`,
  [SCHEDULE_STATUS.ON_SCHEDULE]: () =>
    `Sin atraso: ${EARNED.acronym} llegó exactamente a ${PLANNED.acronym}`,
  [SCHEDULE_STATUS.NOT_APPLICABLE]: () => `Sin datos para comparar con ${PLANNED.acronym}`,
};

/** How the distance between AC and EV reads, per cost status of the report. */
const COST_GAP_READING: Record<CostStatus, GapReading> = {
  [COST_STATUS.OVER_BUDGET]: (amount) => `Sobrecosto de ${amount}: pagué más de lo que produje`,
  [COST_STATUS.UNDER_BUDGET]: (amount) => `Ahorro de ${amount}: pagué menos de lo que produje`,
  [COST_STATUS.ON_BUDGET]: () => `Sin sobrecosto: ${ACTUAL.acronym} igual a ${EARNED.acronym}`,
  [COST_STATUS.NOT_APPLICABLE]: () => `Sin datos para comparar con ${EARNED.acronym}`,
};

/** The value a bar is measured against, so the comparison is a visible distance. */
export interface ComparisonGap {
  /** Value the reference mark sits on, in the same money scale as the bar. */
  referenceValue: number;
  /** Plain-Spanish reading of the variance, with its amount and the acronym compared to. */
  reading: string;
  /** Traffic light of the status the report brought for this comparison. */
  tone: EvmTone;
}

export interface ComparisonRow {
  key: SeriesKey;
  label: string;
  acronym: string;
  value: number;
  colorToken: string;
  /** Absent on the plan, which is the baseline the other two are read against. */
  gap?: ComparisonGap;
}

export function toComparisonRows(indicators: EvmIndicators): ComparisonRow[] {
  return [
    {
      key: SERIES_KEYS.PLANNED_VALUE,
      ...PLANNED,
      value: indicators.plannedValue,
      colorToken: SERIES_COLOR_TOKEN[SERIES_KEYS.PLANNED_VALUE],
    },
    {
      key: SERIES_KEYS.EARNED_VALUE,
      ...EARNED,
      value: indicators.earnedValue,
      colorToken: SERIES_COLOR_TOKEN[SERIES_KEYS.EARNED_VALUE],
      gap: {
        referenceValue: indicators.plannedValue,
        reading: SCHEDULE_GAP_READING[indicators.scheduleStatus](
          formatMoney(Math.abs(indicators.scheduleVariance)),
        ),
        tone: scheduleStatusTone(indicators.scheduleStatus),
      },
    },
    {
      key: SERIES_KEYS.ACTUAL_COST,
      ...ACTUAL,
      value: indicators.actualCost,
      colorToken: SERIES_COLOR_TOKEN[SERIES_KEYS.ACTUAL_COST],
      gap: {
        referenceValue: indicators.earnedValue,
        reading: COST_GAP_READING[indicators.costStatus](
          formatMoney(Math.abs(indicators.costVariance)),
        ),
        tone: costStatusTone(indicators.costStatus),
      },
    },
  ];
}

/** Largest of the three values: it sets the 100 % of the shared money scale. */
export function comparisonScale(rows: readonly ComparisonRow[]): number {
  return Math.max(...rows.map((row) => row.value));
}
