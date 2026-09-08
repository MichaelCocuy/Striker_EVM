import { INDEX_DECIMALS, MONEY_DECIMALS } from '@/lib/format';

import type { EvmIndicators } from '@/api/types';

/** Keys of `EvmIndicators` that hold a number (or `null` when not computable). */
export type NumericIndicatorKey = {
  [Key in keyof EvmIndicators]: EvmIndicators[Key] extends number | null ? Key : never;
}[keyof EvmIndicators];

export interface ActivityIndicatorColumn {
  key: NumericIndicatorKey;
  /** Short header, as EVM_GUIA.md names the indicator. */
  label: string;
  /** Expanded name for the header's `abbr` title. */
  description: string;
  decimals: number;
}

/**
 * Indicator columns shared by the project table and the registrar's cross-project table, in
 * reading order: the three base values, the cost actually incurred, both indices and the
 * forecast. Presentation precision follows EVM_GUIA.md §7.
 */
export const ACTIVITY_INDICATOR_COLUMNS: readonly ActivityIndicatorColumn[] = [
  {
    key: 'budgetAtCompletion',
    label: 'BAC',
    description: 'Presupuesto total de la actividad',
    decimals: MONEY_DECIMALS,
  },
  {
    key: 'plannedValue',
    label: 'PV',
    description: 'Valor planificado a la fecha',
    decimals: MONEY_DECIMALS,
  },
  {
    key: 'earnedValue',
    label: 'EV',
    description: 'Valor ganado a la fecha',
    decimals: MONEY_DECIMALS,
  },
  {
    key: 'actualCost',
    label: 'AC',
    description: 'Costo real incurrido',
    decimals: MONEY_DECIMALS,
  },
  {
    key: 'costPerformanceIndex',
    label: 'CPI',
    description: 'Índice de desempeño del costo',
    decimals: INDEX_DECIMALS,
  },
  {
    key: 'schedulePerformanceIndex',
    label: 'SPI',
    description: 'Índice de desempeño del cronograma',
    decimals: INDEX_DECIMALS,
  },
  {
    key: 'estimateAtCompletion',
    label: 'EAC',
    description: 'Costo estimado al terminar',
    decimals: MONEY_DECIMALS,
  },
];

export const ACTIVITY_COLUMN_LABELS = {
  PROJECT: 'Proyecto',
  NAME: 'Actividad',
  OWNER: 'Responsable',
  PLANNED_PROGRESS: '% plan',
  ACTUAL_PROGRESS: '% real',
  STATUS: 'Estado',
  ACTIONS: 'Acciones',
} as const;

/**
 * Rows opt into their own stagger instead of the shared `data-reveal` one: the dashboard
 * grid reveals whole cards, and a row must not be claimed by that outer timeline as well.
 */
export const ACTIVITIES_REVEAL_ATTRIBUTE = 'data-activities-reveal';
export const ACTIVITIES_REVEAL_SELECTOR = `[${ACTIVITIES_REVEAL_ATTRIBUTE}]`;

/** Shared cell geometry so headers and body cells always line up. */
export const TABLE_CLASS = {
  SCROLL_CONTAINER: 'max-h-[32rem] overflow-auto rounded-md border border-line',
  TABLE: 'w-full min-w-6xl text-sm',
  CAPTION: 'sr-only',
  HEADER_ROW: 'text-left text-xs uppercase tracking-wide text-ink-subtle',
  HEADER_CELL: 'whitespace-nowrap px-3 py-2 font-semibold',
  NUMERIC_HEADER_CELL: 'whitespace-nowrap px-3 py-2 text-right font-semibold',
  CELL: 'whitespace-nowrap px-3 py-3 align-middle text-ink-muted',
  NUMERIC_CELL: 'numeric whitespace-nowrap px-3 py-3 text-right align-middle text-ink',
  NAME_CELL: 'px-3 py-3 text-left align-middle font-medium text-ink',
} as const;
