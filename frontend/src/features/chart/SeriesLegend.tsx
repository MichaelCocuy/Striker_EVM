import { INDICATORS } from '@/features/evm-report/indicator-copy';

import { CHART_FURNITURE_TOKEN, CHART_SERIES } from './chart-config';

import type { TokenColors } from '@/theme/useTokenColors';

const COPY = {
  LIST_LABEL: 'Series de la gráfica',
  SEPARATOR: ' · ',
} as const;

const LIST_CLASS = 'flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-caption';
const ITEM_CLASS = 'flex items-center gap-2 text-ink-muted';
const SERIES_SWATCH_CLASS = 'h-2 w-3 shrink-0 rounded-sm';
/** The budget is a marker, not a series, so its swatch is the vertical rule that draws it. */
const BUDGET_SWATCH_CLASS = 'h-3 w-0.5 shrink-0';

interface SeriesLegendProps {
  /** Resolved token colors, shared with the bars so the legend cannot drift from them. */
  colors: TokenColors;
}

/**
 * Legend of the per-activity bars, in HTML rather than inside the SVG, so the labels wear
 * the ink tokens and wrap like the rest of the card at 360px.
 */
export function SeriesLegend({ colors }: SeriesLegendProps) {
  return (
    <ul aria-label={COPY.LIST_LABEL} className={LIST_CLASS}>
      {CHART_SERIES.map((series) => (
        <li key={series.key} className={ITEM_CLASS}>
          <span
            aria-hidden="true"
            className={SERIES_SWATCH_CLASS}
            style={{ backgroundColor: colors[series.fillToken] }}
          />
          {`${series.acronym}${COPY.SEPARATOR}${series.label}`}
        </li>
      ))}
      <li className={ITEM_CLASS}>
        <span
          aria-hidden="true"
          className={BUDGET_SWATCH_CLASS}
          style={{ backgroundColor: colors[CHART_FURNITURE_TOKEN.BUDGET_MARKER] }}
        />
        {`${INDICATORS.BUDGET_AT_COMPLETION.acronym}${COPY.SEPARATOR}${INDICATORS.BUDGET_AT_COMPLETION.name}`}
      </li>
    </ul>
  );
}
