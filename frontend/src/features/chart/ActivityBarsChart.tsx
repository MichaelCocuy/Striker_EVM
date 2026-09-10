import { useFractionSweep } from '@/motion/useFractionSweep';
import { useTokenColors } from '@/theme/useTokenColors';

import { activityBarsMax } from './activity-bars';
import {
  axisTicks,
  BARS,
  barsPlotBottom,
  barsViewBox,
  barY,
  groupTop,
  moneyToWidth,
  moneyToX,
} from './activity-bars-geometry';
import { ActivityValuesTable } from './ActivityValuesTable';
import { CHART_COLOR_TOKENS, CHART_FURNITURE_TOKEN, CHART_SERIES } from './chart-config';
import { formatCompactMoney } from './chart-format';
import { niceScale } from './nice-scale';
import { SeriesLegend } from './SeriesLegend';

import type { ActivityBarRow } from './activity-bars';

const COPY = {
  PLOT_LABEL:
    'Barras horizontales de PV, EV y AC por actividad sobre una escala de dinero compartida, con la marca del presupuesto de cada actividad.',
} as const;

/** The bars sweep out from the axis once; the sweep is the whole plot, not one bar each. */
const FULL_SWEEP = 1;

const PLOT_CLASS = 'min-w-0 overflow-x-auto';
const SVG_CLASS = 'h-auto w-full min-w-[420px]';

interface ActivityBarsChartProps {
  rows: readonly ActivityBarRow[];
}

/**
 * Horizontal PV / EV / AC bars, one group per activity, on a shared money axis (handoff
 * §3.4). The vertical dashed rule marks the budget of the group, so an activity that will
 * overrun is seen against its own budget and not only against its siblings.
 *
 * Hand-rolled SVG: the axis at x 70, the 110px per 10.000 and the budget marker are exact
 * geometry the handoff fixes, and none of it is expressible through Recharts' own axes.
 */
export function ActivityBarsChart({ rows }: ActivityBarsChartProps) {
  const colors = useTokenColors(CHART_COLOR_TOKENS);
  const sweep = useFractionSweep(FULL_SWEEP);
  const scale = niceScale(activityBarsMax(rows), BARS.TICK_COUNT);
  const plotBottom = barsPlotBottom(rows.length);
  const ticks = axisTicks(scale);

  return (
    <div className="flex flex-col gap-3">
      <div className={PLOT_CLASS}>
        <svg
          viewBox={barsViewBox(rows.length)}
          role="img"
          aria-label={COPY.PLOT_LABEL}
          className={SVG_CLASS}
        >
          <line
            x1={BARS.AXIS_X}
            y1={BARS.FIRST_BAR_Y}
            x2={BARS.AXIS_X}
            y2={plotBottom}
            stroke={colors[CHART_FURNITURE_TOKEN.AXIS]}
          />
          {ticks.map((tick) => (
            <g key={tick.x}>
              <line
                x1={tick.x}
                y1={BARS.GRID_TOP_Y}
                x2={tick.x}
                y2={plotBottom}
                stroke={colors[CHART_FURNITURE_TOKEN.GRID]}
              />
              <text
                x={tick.x}
                y={plotBottom + BARS.TICK_LABEL_OFFSET_Y}
                textAnchor="middle"
                fontSize={BARS.TICK_FONT_SIZE}
                fill={colors[CHART_FURNITURE_TOKEN.LABEL_INK]}
              >
                {formatCompactMoney(tick.value)}
              </text>
            </g>
          ))}
          {rows.map((row, groupIndex) => (
            <g key={row.id}>
              <text
                x={BARS.NAME_X}
                y={groupTop(groupIndex) + BARS.NAME_OFFSET_Y}
                textAnchor="end"
                fontSize={BARS.NAME_FONT_SIZE}
                fill={colors[CHART_FURNITURE_TOKEN.NAME_INK]}
                className="font-heading font-semibold"
              >
                {row.name}
              </text>
              {CHART_SERIES.map((series, seriesIndex) => (
                <rect
                  key={series.key}
                  x={BARS.AXIS_X}
                  y={barY(groupIndex, seriesIndex)}
                  width={moneyToWidth(row[series.key], scale) * sweep}
                  height={BARS.BAR_HEIGHT}
                  rx={BARS.BAR_RADIUS}
                  fill={colors[series.fillToken]}
                />
              ))}
              <line
                x1={moneyToX(row.budgetAtCompletion, scale)}
                y1={groupTop(groupIndex) - BARS.MARKER_TOP_OFFSET}
                x2={moneyToX(row.budgetAtCompletion, scale)}
                y2={groupTop(groupIndex) + BARS.MARKER_BOTTOM_OFFSET}
                stroke={colors[CHART_FURNITURE_TOKEN.BUDGET_MARKER]}
                strokeWidth={BARS.MARKER_WIDTH}
                strokeDasharray={BARS.MARKER_DASH}
              />
            </g>
          ))}
        </svg>
      </div>
      <SeriesLegend colors={colors} />
      <ActivityValuesTable rows={rows} />
    </div>
  );
}
