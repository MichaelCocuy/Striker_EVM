import { EMPTY_SCALE } from './nice-scale';

/**
 * Geometry of the per-activity PV / EV / AC bars, in viewBox units (handoff §3.4).
 *
 * The plot is horizontal so activity names read without rotating or truncating, and the
 * money axis is shared by every group. With the shared report fixture (largest figure
 * 40.000) these constants reproduce the handoff tick for tick: axis at x 70, grid at
 * x 180 / 290 / 400 / 510 and 10.000 worth 110px.
 */
export const BARS = {
  VIEWBOX_WIDTH: 540,
  AXIS_X: 70,
  PLOT_WIDTH: 440,
  TICK_COUNT: 4,
  GRID_TOP_Y: 30,
  FIRST_BAR_Y: 40,
  /** Vertical distance between two activity groups. */
  GROUP_PITCH: 60,
  BAR_HEIGHT: 9,
  /** Distance between the tops of two bars of the same activity (9px bar + 3px gap). */
  BAR_PITCH: 12,
  BAR_RADIUS: 2,
  /** Room under the plot for the money tick labels. */
  BOTTOM_PADDING: 30,
  TICK_LABEL_OFFSET_Y: 20,
  TICK_FONT_SIZE: 11,
  /** The activity name sits to the left of the axis, right-anchored. */
  NAME_X: 62,
  NAME_OFFSET_Y: 15,
  NAME_FONT_SIZE: 12,
  /** The budget marker overshoots the group above and below so it reads as a scale tick. */
  MARKER_TOP_OFFSET: 4,
  MARKER_BOTTOM_OFFSET: 38,
  MARKER_WIDTH: 1.5,
  MARKER_DASH: '3 2',
} as const;

/** Bottom of the plot area, which grows with the number of activities. */
export function barsPlotBottom(groupCount: number): number {
  return BARS.FIRST_BAR_Y + BARS.GROUP_PITCH * groupCount;
}

export function barsViewBox(groupCount: number): string {
  const height = barsPlotBottom(groupCount) + BARS.BOTTOM_PADDING;
  return `0 0 ${String(BARS.VIEWBOX_WIDTH)} ${String(height)}`;
}

/** Width of a bar on the shared money axis, clamped so no figure can leave the plot. */
export function moneyToWidth(value: number, scale: number): number {
  if (scale <= EMPTY_SCALE) {
    return EMPTY_SCALE;
  }
  const width = (value / scale) * BARS.PLOT_WIDTH;
  return Math.min(Math.max(width, EMPTY_SCALE), BARS.PLOT_WIDTH);
}

export function moneyToX(value: number, scale: number): number {
  return BARS.AXIS_X + moneyToWidth(value, scale);
}

export interface AxisTick {
  value: number;
  x: number;
}

/** The `TICK_COUNT` money ticks of the axis, the first one carrying the visible grid line. */
export function axisTicks(scale: number): AxisTick[] {
  return Array.from({ length: BARS.TICK_COUNT }, (_unused, index) => {
    const step = index + 1;
    return {
      value: (scale / BARS.TICK_COUNT) * step,
      x: BARS.AXIS_X + (BARS.PLOT_WIDTH / BARS.TICK_COUNT) * step,
    };
  });
}

/** Top of the first bar of an activity group. */
export function groupTop(groupIndex: number): number {
  return BARS.FIRST_BAR_Y + BARS.GROUP_PITCH * groupIndex;
}

export function barY(groupIndex: number, seriesIndex: number): number {
  return groupTop(groupIndex) + BARS.BAR_PITCH * seriesIndex;
}
