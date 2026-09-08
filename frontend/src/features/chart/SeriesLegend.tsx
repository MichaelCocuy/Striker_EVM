import { CHART_SERIES } from './chart-config';

const LEGEND_LABEL = 'Series de la gráfica';

interface SeriesLegendProps {
  /** Resolved series colors, shared with the bars. */
  colors: Record<string, string>;
}

/**
 * Legend rendered in HTML instead of Recharts' own, so the labels wear the ink tokens and
 * wrap like the rest of the card at 360 px.
 */
export function SeriesLegend({ colors }: SeriesLegendProps) {
  return (
    <ul aria-label={LEGEND_LABEL} className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
      {CHART_SERIES.map((series) => (
        <li key={series.key} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: colors[series.colorToken] }}
          />
          {series.label}
        </li>
      ))}
    </ul>
  );
}
