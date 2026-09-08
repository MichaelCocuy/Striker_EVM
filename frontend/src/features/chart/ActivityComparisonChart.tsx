import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { usePrefersReducedMotion } from '@/motion/reduced-motion';
import { useTokenColors } from '@/theme/useTokenColors';

import { ActivityTooltip } from './ActivityTooltip';
import { ActivityValuesTable } from './ActivityValuesTable';
import {
  CHART_ANIMATION_EASING,
  CHART_ANIMATION_MS,
  CHART_COLOR_TOKENS,
  CHART_FURNITURE_TOKENS,
  CHART_LAYOUT,
  CHART_MARGIN,
  CHART_SERIES,
} from './chart-config';
import { formatCompactMoney } from './chart-format';
import { SeriesLegend } from './SeriesLegend';

import type { ChartRow } from './chart-rows';

const X_AXIS_KEY = 'tick';
const BAR_RADIUS: [number, number, number, number] = [
  CHART_LAYOUT.BAR_CORNER_RADIUS_PX,
  CHART_LAYOUT.BAR_CORNER_RADIUS_PX,
  0,
  0,
];

interface ActivityComparisonChartProps {
  rows: ChartRow[];
}

/**
 * Grouped bars comparing PV, EV and AC for every activity of the report, in report order.
 *
 * The plot itself is hidden from assistive technology: `ActivityValuesTable` carries the same
 * numbers as text, which is the only form a screen reader can read.
 */
export function ActivityComparisonChart({ rows }: ActivityComparisonChartProps) {
  const colors = useTokenColors(CHART_COLOR_TOKENS);
  const isReducedMotion = usePrefersReducedMotion();
  const gridColor = colors[CHART_FURNITURE_TOKENS.GRID];
  const tickStyle = {
    fill: colors[CHART_FURNITURE_TOKENS.AXIS_INK],
    fontSize: CHART_LAYOUT.AXIS_FONT_SIZE_PX,
  };

  return (
    <div className="flex flex-col gap-3">
      <SeriesLegend colors={colors} />
      <div aria-hidden="true" className="min-w-0" style={{ height: CHART_LAYOUT.HEIGHT_PX }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            margin={CHART_MARGIN}
            barGap={CHART_LAYOUT.BAR_GAP_PX}
            barCategoryGap={CHART_LAYOUT.CATEGORY_GAP_PERCENT}
          >
            <CartesianGrid vertical={false} stroke={gridColor} />
            <XAxis
              dataKey={X_AXIS_KEY}
              interval={0}
              height={CHART_LAYOUT.X_AXIS_HEIGHT_PX}
              tickMargin={CHART_LAYOUT.TICK_MARGIN_PX}
              tickLine={false}
              stroke={gridColor}
              tick={tickStyle}
            />
            <YAxis
              width={CHART_LAYOUT.Y_AXIS_WIDTH}
              tickFormatter={formatCompactMoney}
              tickLine={false}
              axisLine={false}
              tick={tickStyle}
            />
            <Tooltip
              cursor={{ fill: gridColor }}
              isAnimationActive={!isReducedMotion}
              animationDuration={CHART_ANIMATION_MS}
              content={<ActivityTooltip rows={rows} colors={colors} />}
            />
            {CHART_SERIES.map((series) => (
              <Bar
                key={series.key}
                dataKey={series.key}
                name={series.label}
                fill={colors[series.colorToken]}
                radius={BAR_RADIUS}
                isAnimationActive={!isReducedMotion}
                animationDuration={CHART_ANIMATION_MS}
                animationEasing={CHART_ANIMATION_EASING}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ActivityValuesTable rows={rows} />
    </div>
  );
}
