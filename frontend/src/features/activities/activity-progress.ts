import { formatMoney, formatPercent } from '@/lib/format';

import type { ActivityMeasures, EvmIndicators } from '@/api/types';

/**
 * Height of the progress track per context, from the handoff: 6 px in the table row, 8 px in
 * the card of «Mis actividades» and 10 px in the activity detail and the entry panel.
 */
export const PROGRESS_TRACK_SIZE = {
  ROW: 'h-1.5',
  CARD: 'h-2',
  DETAIL: 'h-2.5',
} as const;

export type ProgressTrackSize = (typeof PROGRESS_TRACK_SIZE)[keyof typeof PROGRESS_TRACK_SIZE];

export const PROGRESS_COPY = {
  PLANNED: 'Avance planificado',
  ACTUAL: 'Avance real',
  /** Short labels of the card and the panel, where the bar carries its own header. */
  PLANNED_SHORT: 'Plan',
  ACTUAL_SHORT: 'Real',
  /** BAC and PV lost their columns in the redesign; this is where they stay readable. */
  BUDGET_AT_COMPLETION: 'Presupuesto total (BAC)',
  PLANNED_VALUE: 'Valor planificado (PV)',
  SEPARATOR: ' · ',
} as const;

interface ActivityProgressReadingInput {
  input: ActivityMeasures;
  indicators: EvmIndicators;
}

/** The two percentages of the bar plus the two figures the table no longer shows as columns. */
export function progressReading({ input, indicators }: ActivityProgressReadingInput): string {
  return [
    `${PROGRESS_COPY.ACTUAL} ${formatPercent(input.actualProgressPercent)}`,
    `${PROGRESS_COPY.PLANNED} ${formatPercent(input.plannedProgressPercent)}`,
    `${PROGRESS_COPY.BUDGET_AT_COMPLETION} ${formatMoney(indicators.budgetAtCompletion)}`,
    `${PROGRESS_COPY.PLANNED_VALUE} ${formatMoney(indicators.plannedValue)}`,
  ].join(PROGRESS_COPY.SEPARATOR);
}
