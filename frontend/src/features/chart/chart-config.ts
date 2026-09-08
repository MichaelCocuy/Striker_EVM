import { MOTION_DURATION_SECONDS } from '@/motion/constants';

/**
 * Presentation configuration of the PV / EV / AC comparison (module M10).
 *
 * Colors are token *names*: they are resolved against the document root at runtime so the
 * chart follows the light and dark themes without duplicating any hex value here.
 */

export const SERIES_KEYS = {
  PLANNED_VALUE: 'plannedValue',
  EARNED_VALUE: 'earnedValue',
  ACTUAL_COST: 'actualCost',
} as const;

export type SeriesKey = (typeof SERIES_KEYS)[keyof typeof SERIES_KEYS];

export interface ChartSeries {
  key: SeriesKey;
  /** Legend and tooltip name, in Spanish, with the EVM acronym. */
  label: string;
  colorToken: string;
}

/**
 * Fixed categorical order and fixed hues: a series never changes color, so the legend read
 * once keeps working. Green and red stay reserved for the EVM traffic light and never encode
 * a series; the plan is therefore a neutral ink (it is the baseline), what was earned takes
 * the brand accent, and the spend takes the only other chromatic family the tokens offer.
 */
export const CHART_SERIES: readonly ChartSeries[] = [
  {
    key: SERIES_KEYS.PLANNED_VALUE,
    label: 'Valor planificado (PV)',
    colorToken: '--ink-muted',
  },
  {
    key: SERIES_KEYS.EARNED_VALUE,
    label: 'Valor ganado (EV)',
    colorToken: '--accent',
  },
  {
    key: SERIES_KEYS.ACTUAL_COST,
    label: 'Costo real (AC)',
    colorToken: '--evm-neutral',
  },
];

/** Tokens for the chart furniture (recessive grid and axis ink). */
export const CHART_FURNITURE_TOKENS = {
  GRID: '--line',
  AXIS_INK: '--ink-subtle',
} as const;

/** Every token the comparison chart resolves; a stable array so the hook can memoize it. */
export const CHART_COLOR_TOKENS: readonly string[] = [
  ...CHART_SERIES.map((series) => series.colorToken),
  CHART_FURNITURE_TOKENS.GRID,
  CHART_FURNITURE_TOKENS.AXIS_INK,
];

/** Geometry kept small and thin so the chart stays readable inside a 360 px viewport. */
export const CHART_LAYOUT = {
  HEIGHT_PX: 240,
  BAR_CORNER_RADIUS_PX: 4,
  /** Surface gap between adjacent bars of the same activity. */
  BAR_GAP_PX: 2,
  CATEGORY_GAP_PERCENT: '24%',
  AXIS_FONT_SIZE_PX: 11,
  /** Recharts sizes the money axis from its own tick text, so "1,5 millones" cannot clip. */
  Y_AXIS_WIDTH: 'auto',
  X_AXIS_HEIGHT_PX: 24,
  TICK_MARGIN_PX: 6,
} as const;

/** Plot margins; the y axis reserves its own width, so only the top needs room. */
export const CHART_MARGIN = { top: 8, right: 4, bottom: 0, left: 0 } as const;

/** Activity names longer than this are truncated on the x axis; the tooltip shows them whole. */
export const AXIS_NAME_MAX_CHARS = 12;

export const MILLISECONDS_PER_SECOND = 1000;

/** Recharts animations are configured in milliseconds from the shared motion durations. */
export const CHART_ANIMATION_MS = MOTION_DURATION_SECONDS.SLOW * MILLISECONDS_PER_SECOND;
export const CHART_ANIMATION_EASING = 'ease-out';
