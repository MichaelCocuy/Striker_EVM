export const ACTIVITY_COLUMN_LABELS = {
  NAME: 'Actividad',
  OWNER: 'Responsable',
  DEVIATION: 'Desviación',
  PROGRESS: 'Avance',
  /** Header of the affordance column: the arrow that leads to the activity detail. */
  DETAIL: 'Detalle',
} as const;

/**
 * The mockup calls this column "Tendencia" and draws a sparkline, but the contract carries one
 * planned/actual pair per activity at a single cut-off date: a trend over time would be
 * invented data. The column says what it really shows and its header repeats it.
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
 * The table keeps the `min-w-[900px]` of the handoff and scrolls inside its own container, so
 * it never pushes the viewport sideways. The `max-[700px]:` variants are the stacked layout of
 * ARQUITECTURA §12: below 700 px each row becomes a card whose cells show their own label
 * instead of crawling sideways. The width is written literally in every class because Tailwind
 * only emits utilities it can read in the source.
 */
export const TABLE_CLASS = {
  SCROLL_CONTAINER: 'overflow-x-auto max-[700px]:overflow-x-visible',
  TABLE:
    'w-full min-w-[900px] border-collapse text-small max-[700px]:block max-[700px]:min-w-0 max-[700px]:text-body',
  CAPTION: 'sr-only',
  HEAD: 'max-[700px]:hidden',
  HEADER_CELL:
    'whitespace-nowrap border-b border-line px-2.5 pb-2.5 text-left font-heading text-badge font-bold uppercase tracking-wide text-ink-subtle',
  NUMERIC_HEADER_CELL:
    'whitespace-nowrap border-b border-line px-2.5 pb-2.5 text-right font-heading text-badge font-bold uppercase tracking-wide text-ink-subtle',
  BODY: 'max-[700px]:flex max-[700px]:flex-col max-[700px]:gap-3',
  ROW: 'cursor-pointer border-b border-surface-sunken transition-colors duration-150 hover:bg-canvas max-[700px]:block max-[700px]:rounded-lg max-[700px]:border max-[700px]:border-line max-[700px]:px-3 max-[700px]:py-2',
  CELL: 'px-2.5 py-3 align-middle text-ink-muted max-[700px]:flex max-[700px]:items-center max-[700px]:justify-between max-[700px]:gap-4 max-[700px]:px-0 max-[700px]:py-1.5',
  NUMERIC_CELL:
    'numeric whitespace-nowrap px-2.5 py-3 text-right align-middle text-ink max-[700px]:flex max-[700px]:items-center max-[700px]:justify-between max-[700px]:gap-4 max-[700px]:px-0 max-[700px]:py-1.5',
  CHIP_CELL:
    'whitespace-nowrap px-2.5 py-3 text-right align-middle max-[700px]:flex max-[700px]:items-center max-[700px]:justify-between max-[700px]:gap-4 max-[700px]:px-0 max-[700px]:py-1.5',
  NAME_CELL:
    'px-2.5 py-3 text-left align-middle max-[700px]:block max-[700px]:px-0 max-[700px]:pt-1 max-[700px]:pb-2',
  /** Column name repeated inside the cell; only visible once the row reads as a card. */
  STACK_LABEL:
    'hidden text-caption font-semibold uppercase tracking-wide text-ink-subtle max-[700px]:block',
} as const;
