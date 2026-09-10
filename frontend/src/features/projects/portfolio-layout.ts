/**
 * Structural classes of the portfolio, shared by the real content and by its loading
 * skeleton so both keep exactly the same shape and the layout never jumps.
 *
 * Geometry from the design handoff: a column of 18 px gaps, a KPI strip of `minmax(200px, 1fr)`
 * tracks and a content grid of `minmax(420px, 1fr)` tracks, both 14 px apart. The `min(…, 100%)`
 * guard is what keeps a track from being wider than a narrow viewport.
 */
export const PORTFOLIO_LAYOUT = {
  COLUMNS: 'grid grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] items-start gap-3.5',
  KPI_STRIP: 'grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-3.5',
  KPI_TILE: 'flex flex-col gap-1.5 rounded-lg border border-line bg-surface px-4.5 py-4 shadow-low',
  ROW: 'rounded-lg border border-line bg-surface px-4 py-3.5 shadow-low',
  ROW_STACK: 'flex flex-col gap-3',
} as const;
