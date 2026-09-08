import { formatIndex, formatMoney } from '@/lib/format';

import { CHART_SERIES } from './chart-config';

import type { ChartRow } from './chart-rows';

const COPY = {
  CPI: 'CPI',
  SPI: 'SPI',
} as const;

/**
 * Recharts clones this element with its tooltip state; these are the only props read.
 * The hovered row is looked up by index, which keeps the payload untyped `any` out of here.
 */
export interface ActivityTooltipProps {
  rows: readonly ChartRow[];
  /** Resolved series colors, so the swatches cannot drift from the bars. */
  colors: Record<string, string>;
  active?: boolean;
  /** Index of the hovered category as a string, or null when nothing is hovered. */
  activeIndex?: string | null;
}

/** Explains the hovered group: its three money values plus the indices they produced. */
export function ActivityTooltip({ rows, colors, active, activeIndex }: ActivityTooltipProps) {
  const row = active === true && activeIndex != null ? rows[Number(activeIndex)] : undefined;
  if (row === undefined) {
    return null;
  }

  return (
    <div className="card max-w-64 p-3 shadow-raised">
      <p className="text-sm font-semibold text-ink">{row.name}</p>
      <dl className="mt-2 flex flex-col gap-1 text-xs">
        {CHART_SERIES.map((series) => (
          <div key={series.key} className="flex items-baseline justify-between gap-3">
            <dt className="flex items-center gap-2 text-ink-muted">
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-sm"
                style={{ backgroundColor: colors[series.colorToken] }}
              />
              {series.label}
            </dt>
            <dd className="numeric font-medium text-ink">{formatMoney(row[series.key])}</dd>
          </div>
        ))}
      </dl>
      <dl className="mt-2 flex justify-between gap-3 border-t border-line pt-2 text-xs">
        <div className="flex gap-2">
          <dt className="text-ink-muted">{COPY.CPI}</dt>
          <dd className="numeric font-medium text-ink">{formatIndex(row.costPerformanceIndex)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-ink-muted">{COPY.SPI}</dt>
          <dd className="numeric font-medium text-ink">
            {formatIndex(row.schedulePerformanceIndex)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
