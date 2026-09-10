import { EVM_TONE, EVM_TONE_TOKENS } from '@/evm/tone';
import { INDICATORS } from '@/features/evm-report/indicator-copy';

/**
 * Presentation configuration shared by the four charts of the dashboard (handoff §3.3–§3.6).
 *
 * Colors are token *names*: `useTokenColors` resolves them against the document root at
 * runtime, because an SVG presentation attribute does not accept `var(--token)`. No hex
 * value is repeated here, so the charts follow the light and dark themes.
 */

export const SERIES_KEYS = {
  PLANNED_VALUE: 'plannedValue',
  EARNED_VALUE: 'earnedValue',
  ACTUAL_COST: 'actualCost',
} as const;

export type SeriesKey = (typeof SERIES_KEYS)[keyof typeof SERIES_KEYS];

/**
 * Fixed hues: a series never changes color, so the legend read once keeps working. Green and
 * red stay reserved for the EVM traffic light and never encode a series; the plan is
 * therefore a neutral ink (it is the baseline), what was earned takes the bright brand teal
 * and the spend takes the amber the system reserves for it.
 */
export const SERIES_FILL_TOKEN: Record<SeriesKey, string> = {
  [SERIES_KEYS.PLANNED_VALUE]: '--ink-muted',
  [SERIES_KEYS.EARNED_VALUE]: '--accent-bright',
  [SERIES_KEYS.ACTUAL_COST]: '--evm-neutral',
};

/**
 * Ink of the figure written next to a bar. The bright teal of the bar is 3,2:1 on white and
 * must never be letters, so the earned series writes its figure in the text-safe teal —
 * the one-line rule of the design system.
 */
export const SERIES_INK_TOKEN: Record<SeriesKey, string> = {
  [SERIES_KEYS.PLANNED_VALUE]: '--ink',
  [SERIES_KEYS.EARNED_VALUE]: '--accent',
  [SERIES_KEYS.ACTUAL_COST]: '--evm-neutral',
};

export interface ChartSeries {
  key: SeriesKey;
  /** Legend name, in Spanish, with the EVM acronym. */
  label: string;
  acronym: string;
  fillToken: string;
}

/** Fixed categorical order of the series: plan, then work done, then money paid. */
export const CHART_SERIES: readonly ChartSeries[] = [
  {
    key: SERIES_KEYS.PLANNED_VALUE,
    label: INDICATORS.PLANNED_VALUE.name,
    acronym: INDICATORS.PLANNED_VALUE.acronym,
    fillToken: SERIES_FILL_TOKEN[SERIES_KEYS.PLANNED_VALUE],
  },
  {
    key: SERIES_KEYS.EARNED_VALUE,
    label: INDICATORS.EARNED_VALUE.name,
    acronym: INDICATORS.EARNED_VALUE.acronym,
    fillToken: SERIES_FILL_TOKEN[SERIES_KEYS.EARNED_VALUE],
  },
  {
    key: SERIES_KEYS.ACTUAL_COST,
    label: INDICATORS.ACTUAL_COST.name,
    acronym: INDICATORS.ACTUAL_COST.acronym,
    fillToken: SERIES_FILL_TOKEN[SERIES_KEYS.ACTUAL_COST],
  },
];

/** Tokens for the chart furniture: axis, recessive grid, labels and the budget marker. */
export const CHART_FURNITURE_TOKEN = {
  AXIS: '--line',
  GRID: '--surface-sunken',
  CONNECTOR: '--line-strong',
  LABEL_INK: '--ink-subtle',
  NAME_INK: '--ink',
  GLOSS_INK: '--ink-muted',
  BUDGET_MARKER: '--ink',
  HALO: '--surface',
} as const;

/**
 * Every token the charts resolve, as one stable array so `useTokenColors` can memoize it:
 * the three series fills, the inks of their figures, the furniture and the four tones of
 * the traffic light with their soft backgrounds.
 */
export const CHART_COLOR_TOKENS: readonly string[] = [
  ...new Set([
    ...Object.values(SERIES_FILL_TOKEN),
    ...Object.values(SERIES_INK_TOKEN),
    ...Object.values(CHART_FURNITURE_TOKEN),
    ...Object.values(EVM_TONE).flatMap((tone) => [
      EVM_TONE_TOKENS[tone].colorToken,
      EVM_TONE_TOKENS[tone].softColorToken,
    ]),
  ]),
];

/** Activity names longer than this are shortened in the quadrant, where space is scarce. */
export const LABEL_MAX_CHARS = 12;
