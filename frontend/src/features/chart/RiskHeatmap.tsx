import { useMemo } from 'react';

import { Card } from '@/components/ui/Card';
import { SkeletonLines } from '@/components/ui/Skeleton';
import { useTokenColors } from '@/theme/useTokenColors';

import { CHART_COLOR_TOKENS } from './chart-config';
import { HEATMAP_COLUMN_INDICATOR, HEATMAP_COPY, toHeatmapRows } from './heatmap-rows';

import type { EvmActivityReport, EvmIndicators } from '@/api/types';
import type { HTMLAttributes } from 'react';

/** The card renders its own title, so the HTML `title` attribute is not accepted. */
export interface RiskHeatmapProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Activities as the report returns them. */
  activities: readonly EvmActivityReport[];
  /** Consolidated indicators; the project budget is what each weight is measured against. */
  indicators: EvmIndicators | null;
  isLoading: boolean;
  className?: string;
}

const COPY = {
  EYEBROW: 'Mapa de calor',
  TITLE: 'Riesgo por actividad y dimensión',
  DESCRIPTION:
    'Una fila por actividad, una columna por lo que puede fallar. Sirve para decidir dónde intervenir primero.',
} as const;

/** One placeholder line per activity of the demo projects plus the footnote. */
const SKELETON_LINES = 5;

/** 4px gaps between cells, as the handoff's grid, with a semantic table underneath. */
const TABLE_CLASS = 'w-full table-fixed border-separate border-spacing-1 font-heading';
const HEAD_CLASS = 'pb-1 text-center text-badge font-bold tracking-label uppercase text-ink-subtle';
const ACTIVITY_HEAD_CLASS = 'w-[30%]';
const NAME_CLASS = 'text-left text-small font-semibold text-ink';
const CELL_CLASS = 'rounded-md px-1.5 py-3 text-center text-caption font-bold';
const FOOTNOTE_CLASS = 'text-caption leading-normal text-ink-subtle';

const HEAD_COLUMNS = [
  { label: HEATMAP_COPY.COLUMNS.COST, meta: HEATMAP_COLUMN_INDICATOR.COST },
  { label: HEATMAP_COPY.COLUMNS.SCHEDULE, meta: HEATMAP_COLUMN_INDICATOR.SCHEDULE },
  { label: HEATMAP_COPY.COLUMNS.CLOSING, meta: HEATMAP_COLUMN_INDICATOR.CLOSING },
  { label: HEATMAP_COPY.COLUMNS.WEIGHT, meta: HEATMAP_COLUMN_INDICATOR.WEIGHT },
] as const;

/**
 * Risk heat map (handoff §3.6, behind the `showRiskHeatmap` flag of the dashboard).
 *
 * It is a real table rather than a CSS grid of spans: the data is tabular, and a screen
 * reader has to be able to say "Desarrollo, Costo, 0,80, sobre presupuesto". Every cell
 * carries its reading in text, so the tone is never the only thing that says what it means.
 *
 * Contract: the indices and the variance come from the report; the weight is the share of
 * the project budget the handoff sanctions computing here.
 */
export function RiskHeatmap({
  activities,
  indicators,
  isLoading,
  className = '',
  ...rest
}: RiskHeatmapProps) {
  const colors = useTokenColors(CHART_COLOR_TOKENS);
  /** Memoized so a re-render with the same report does not rebuild every cell. */
  const rows = useMemo(
    () => (indicators === null ? [] : toHeatmapRows(activities, indicators)),
    [activities, indicators],
  );

  return (
    <Card
      eyebrow={COPY.EYEBROW}
      title={COPY.TITLE}
      description={COPY.DESCRIPTION}
      className={className}
      {...rest}
    >
      {isLoading || indicators === null ? (
        <SkeletonLines count={SKELETON_LINES} />
      ) : rows.length === 0 ? (
        <p className="text-small text-ink-muted">{HEATMAP_COPY.EMPTY}</p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="min-w-0 overflow-x-auto">
            <table className={TABLE_CLASS}>
              <caption className="sr-only">{HEATMAP_COPY.CAPTION}</caption>
              <thead>
                <tr>
                  <th scope="col" className={ACTIVITY_HEAD_CLASS}>
                    <span className="sr-only">{HEATMAP_COPY.COLUMNS.ACTIVITY}</span>
                  </th>
                  {HEAD_COLUMNS.map((column) => (
                    <th key={column.label} scope="col" className={HEAD_CLASS}>
                      {column.label}
                      <span className="sr-only">{` — ${column.meta.acronym}`}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row" className={NAME_CLASS}>
                      {row.name}
                    </th>
                    {row.cells.map((cell) => (
                      <td
                        key={cell.key}
                        className={CELL_CLASS}
                        style={{
                          backgroundColor: colors[cell.backgroundToken],
                          color: colors[cell.inkToken],
                        }}
                      >
                        {cell.text}
                        <span className="sr-only">{` · ${cell.reading}`}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={FOOTNOTE_CLASS}>{HEATMAP_COPY.FOOTNOTE}</p>
        </div>
      )}
    </Card>
  );
}
