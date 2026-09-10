import type { EvmIndicators } from '@/api/types';

/** Keys of `EvmIndicators` that hold a number (or `null` when not computable). */
export type NumericIndicatorKey = {
  [Key in keyof EvmIndicators]: EvmIndicators[Key] extends number | null ? Key : never;
}[keyof EvmIndicators];

/** How a reported number is presented: money right-aligned, or an index inside a toned pill. */
export const ACTIVITY_COLUMN_KIND = {
  MONEY: 'money',
  INDEX: 'index',
} as const;

export type ActivityColumnKind = (typeof ACTIVITY_COLUMN_KIND)[keyof typeof ACTIVITY_COLUMN_KIND];

/**
 * Traffic light of the report that colours an index pill. The tone is chosen from the status
 * the API already sent; no interpretation is derived in the UI.
 */
export const ACTIVITY_INDEX_STATUS = {
  COST: 'costStatus',
  SCHEDULE: 'scheduleStatus',
} as const;

export type ActivityIndexStatus =
  (typeof ACTIVITY_INDEX_STATUS)[keyof typeof ACTIVITY_INDEX_STATUS];

interface ActivityColumnBase {
  key: NumericIndicatorKey;
  /** Short header, as EVM_GUIA.md names the indicator. */
  label: string;
  /** Expanded name plus the question it answers (EVM_GUIA.md §3), for the header's `abbr`. */
  description: string;
}

export interface ActivityMoneyColumn extends ActivityColumnBase {
  kind: typeof ACTIVITY_COLUMN_KIND.MONEY;
}

export interface ActivityIndexColumn extends ActivityColumnBase {
  kind: typeof ACTIVITY_COLUMN_KIND.INDEX;
  statusKey: ActivityIndexStatus;
}

export type ActivityIndicatorColumn = ActivityMoneyColumn | ActivityIndexColumn;

/**
 * Indicator columns shared by the project table and the registrar's cross-project table, in
 * the reading order of the mockup: the value earned, what it cost, both indices and the
 * forecast. BAC and PV lost their columns to the progress cell, which keeps them reachable.
 */
export const ACTIVITY_INDICATOR_COLUMNS: readonly ActivityIndicatorColumn[] = [
  {
    kind: ACTIVITY_COLUMN_KIND.MONEY,
    key: 'earnedValue',
    label: 'EV',
    description: 'Valor ganado: cuánto vale el trabajo ejecutado a la fecha',
  },
  {
    kind: ACTIVITY_COLUMN_KIND.MONEY,
    key: 'actualCost',
    label: 'AC',
    description: 'Costo real: cuánto se ha pagado a la fecha',
  },
  {
    kind: ACTIVITY_COLUMN_KIND.INDEX,
    key: 'costPerformanceIndex',
    statusKey: ACTIVITY_INDEX_STATUS.COST,
    label: 'CPI',
    description: 'Índice de desempeño del costo (EV / AC): cuánto valor recibo por cada peso',
  },
  {
    kind: ACTIVITY_COLUMN_KIND.INDEX,
    key: 'schedulePerformanceIndex',
    statusKey: ACTIVITY_INDEX_STATUS.SCHEDULE,
    label: 'SPI',
    description: 'Índice de desempeño del cronograma (EV / PV): a qué ritmo avanzo frente al plan',
  },
  {
    kind: ACTIVITY_COLUMN_KIND.MONEY,
    key: 'estimateAtCompletion',
    label: 'EAC',
    description: 'Costo estimado al terminar (BAC / CPI): con la eficiencia actual',
  },
];

export const ACTIVITY_COLUMN_LABELS = {
  PROJECT: 'Proyecto',
  NAME: 'Actividad',
  OWNER: 'Responsable',
  DEVIATION: 'Desviación',
  PROGRESS: 'Avance',
  ACTIONS: 'Acciones',
} as const;

/**
 * The mockup calls this column "Tendencia", but the contract carries one planned/actual pair
 * per activity at a single cut-off date: a trend over time would be invented data. The column
 * says what it really shows and its header repeats it.
 */
export const ACTIVITY_DEVIATION_DESCRIPTION =
  'Desviación: compara el avance planificado con el avance real a la fecha de corte del reporte. No es un histórico ni una tendencia en el tiempo.';

/**
 * Rows opt into their own stagger instead of the shared `data-reveal` one: the dashboard
 * grid reveals whole cards, and a row must not be claimed by that outer timeline as well.
 */
export const ACTIVITIES_REVEAL_ATTRIBUTE = 'data-activities-reveal';
export const ACTIVITIES_REVEAL_SELECTOR = `[${ACTIVITIES_REVEAL_ATTRIBUTE}]`;

/**
 * Below the stacked breakpoint the table parts become blocks, which drops the implicit table
 * semantics. Every element therefore states the role it already had, so the accessibility tree
 * stays a table whether the row reads as a row or as a card.
 */
export const TABLE_ROLE = {
  TABLE: 'table',
  ROW_GROUP: 'rowgroup',
  ROW: 'row',
  COLUMN_HEADER: 'columnheader',
  ROW_HEADER: 'rowheader',
  CELL: 'cell',
} as const;

/**
 * Shared cell geometry so headers and body cells always line up.
 *
 * The `max-[700px]:` variants are the stacked layout of ARQUITECTURA §12: wide content scrolls
 * inside `SCROLL_CONTAINER`, and below 700 px each row becomes a card whose cells show their
 * own label instead of crawling sideways. The width is written literally in every class because
 * Tailwind only emits utilities it can read in the source.
 */
export const TABLE_CLASS = {
  SCROLL_CONTAINER:
    'max-h-[32rem] overflow-auto rounded-md border border-line max-[700px]:max-h-none max-[700px]:overflow-visible max-[700px]:rounded-none max-[700px]:border-0',
  TABLE: 'w-full min-w-2xl text-sm max-[700px]:block max-[700px]:min-w-0',
  CAPTION: 'sr-only',
  HEAD: 'sticky top-0 z-10 bg-surface max-[700px]:hidden',
  HEADER_ROW: 'text-left text-xs uppercase tracking-wide text-ink-subtle',
  HEADER_CELL: 'whitespace-nowrap px-3 py-2 font-semibold',
  NUMERIC_HEADER_CELL: 'whitespace-nowrap px-3 py-2 text-right font-semibold',
  BODY: 'max-[700px]:flex max-[700px]:flex-col max-[700px]:gap-3',
  ROW: 'border-t border-line max-[700px]:block max-[700px]:rounded-md max-[700px]:border max-[700px]:px-3 max-[700px]:py-2',
  CELL: 'px-3 py-3 align-middle text-ink-muted max-[700px]:flex max-[700px]:items-center max-[700px]:justify-between max-[700px]:gap-4 max-[700px]:px-0 max-[700px]:py-1.5',
  NUMERIC_CELL:
    'numeric whitespace-nowrap px-3 py-3 text-right align-middle text-ink max-[700px]:flex max-[700px]:items-center max-[700px]:justify-between max-[700px]:gap-4 max-[700px]:px-0 max-[700px]:py-1.5',
  NAME_CELL:
    'px-3 py-3 text-left align-middle text-ink max-[700px]:block max-[700px]:px-0 max-[700px]:pt-1 max-[700px]:pb-2',
  /** Column name repeated inside the cell; only visible once the row reads as a card. */
  STACK_LABEL:
    'hidden text-xs font-semibold uppercase tracking-wide text-ink-subtle max-[700px]:block',
} as const;
