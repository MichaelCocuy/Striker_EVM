import {
  COST_STATUS_LABEL,
  SCHEDULE_STATUS_LABEL,
  costStatusTone,
  scheduleStatusTone,
} from '@/evm/tone';

import type { EvmIndicators } from '@/api/types';
import type { EvmTone } from '@/evm/tone';

/** Keys of `EvmIndicators` that hold a number (or `null` when not computable). */
export type NumericIndicatorKey = {
  [Key in keyof EvmIndicators]: EvmIndicators[Key] extends number | null ? Key : never;
}[keyof EvmIndicators];

/**
 * Traffic light of the report that tones an index. The tone is chosen from the status the API
 * already sent; no interpretation is derived in the UI.
 */
export const ACTIVITY_INDEX_STATUS = {
  COST: 'costStatus',
  SCHEDULE: 'scheduleStatus',
} as const;

export type ActivityIndexStatus =
  (typeof ACTIVITY_INDEX_STATUS)[keyof typeof ACTIVITY_INDEX_STATUS];

export interface ActivityIndexDescriptor {
  key: NumericIndicatorKey;
  /** Short name, as EVM_GUIA.md names the indicator. */
  label: string;
  /** Expanded name plus the question it answers (EVM_GUIA.md §3). */
  description: string;
  statusKey: ActivityIndexStatus;
}

/** The two performance indices, in the reading order of the redesign: cost, then schedule. */
export const ACTIVITY_INDEX_COLUMNS: readonly ActivityIndexDescriptor[] = [
  {
    key: 'costPerformanceIndex',
    label: 'CPI',
    description: 'Índice de desempeño del costo (EV / AC): cuánto valor recibo por cada peso',
    statusKey: ACTIVITY_INDEX_STATUS.COST,
  },
  {
    key: 'schedulePerformanceIndex',
    label: 'SPI',
    description: 'Índice de desempeño del cronograma (EV / PV): a qué ritmo avanzo frente al plan',
    statusKey: ACTIVITY_INDEX_STATUS.SCHEDULE,
  },
];

/** Chip of the table row (12 px, where the column header names the index) and of a card (11 px). */
export const INDEX_CHIP_SIZE = {
  ROW: 'text-caption',
  CARD: 'text-badge',
} as const;

export type IndexChipSize = (typeof INDEX_CHIP_SIZE)[keyof typeof INDEX_CHIP_SIZE];

export interface ActivityIndexReading {
  tone: EvmTone;
  /** The interpretation the report sent for that traffic light, in Spanish. */
  label: string;
}

const INDEX_STATUS_READING: Record<
  ActivityIndexStatus,
  (indicators: EvmIndicators) => ActivityIndexReading
> = {
  [ACTIVITY_INDEX_STATUS.COST]: ({ costStatus }) => ({
    tone: costStatusTone(costStatus),
    label: COST_STATUS_LABEL[costStatus],
  }),
  [ACTIVITY_INDEX_STATUS.SCHEDULE]: ({ scheduleStatus }) => ({
    tone: scheduleStatusTone(scheduleStatus),
    label: SCHEDULE_STATUS_LABEL[scheduleStatus],
  }),
};

/** Tone and label of the traffic light the report brings for that index, never a computed one. */
export function indexStatusReading(
  indicators: EvmIndicators,
  statusKey: ActivityIndexStatus,
): ActivityIndexReading {
  return INDEX_STATUS_READING[statusKey](indicators);
}
