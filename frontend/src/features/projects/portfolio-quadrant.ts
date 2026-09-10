import { EVM_TONE, EVM_TONE_TOKENS, costStatusTone, scheduleStatusTone } from '@/evm/tone';

import type { PortfolioItem } from './portfolio-items';
import type { EvmIndicators } from '@/api/types';

/**
 * Geometry and tones of the cost-schedule quadrant of the portfolio, in viewBox units, exactly
 * as the design handoff specifies them ("2 · Portafolio", «Cuadrante CPI × SPI»).
 *
 * Placing a bubble from the CPI and the SPI the report brings is presentation: no indicator is
 * derived here. A project whose CPI or SPI is `null` gets no point at all — a bubble at zero
 * would read as a real, terrible index.
 */

export const QUADRANT_VIEWBOX = { WIDTH: 460, HEIGHT: 360 } as const;

/** Plot area. It is deliberately off-centre so the most extreme seeded project still fits. */
export const QUADRANT_PLOT = { LEFT: 60, RIGHT: 440, TOP: 30, BOTTOM: 310 } as const;

/** Where SPI = 1,0 and CPI = 1,0 cross. */
export const QUADRANT_ORIGIN = { X: 212, Y: 170 } as const;

/** viewBox units per whole unit of index; x grows to the right, y grows upwards. */
const UNITS_PER_INDEX = { X: 232, Y: 172 } as const;

/**
 * Bubble radius maps the BAC over a fixed window with a low ceiling: two projects with similar
 * indices must not cover each other, which a proportional radius would let them do.
 */
const BUBBLE_RADIUS = { MIN: 8, MAX: 11 } as const;
const BUBBLE_BUDGET_WINDOW = { MIN: 30000, MAX: 60000 } as const;

/** An off-scale point is nudged inside the plot so its outline and its number stay clear. */
const CLAMP_INSET = { X: 3, Y: 5 } as const;

export const QUADRANT_BAND_OPACITY = { GOOD: 0.35, BAD: 0.28 } as const;

export const QUADRANT_BUBBLE = {
  STROKE_WIDTH: 1.5,
  FILL_OPACITY: 0.2,
  /** Dashed outline of a bubble drawn at the plot edge instead of at its own coordinates. */
  OFF_SCALE_DASH: '3 3',
  LABEL_FONT_SIZE: 9,
  /** The number is centred on the bubble, so its baseline sits below the centre. */
  LABEL_BASELINE_OFFSET: 4,
} as const;

export const QUADRANT_REFERENCE_DASH = '4 4';
export const QUADRANT_LINE_WIDTH = 1;

export const QUADRANT_TEXT = {
  REFERENCE_FONT_SIZE: 11,
  CORNER_FONT_SIZE: 10,
  CORNER_LETTER_SPACING: 1,
  AXIS_TITLE_FONT_SIZE: 11,
} as const;

/** Anchors of the fixed labels, straight from the handoff's coordinate list. */
export const QUADRANT_ANCHOR = {
  SPI_REFERENCE: { x: 216, y: 26 },
  /** Inside the plot area on purpose: to the left of the axis it would hit the rotated title. */
  CPI_REFERENCE: { x: 66, y: 165 },
  CHEAP: { x: 434, y: 46 },
  EXPENSIVE: { x: 434, y: 302 },
  X_AXIS_TITLE: { x: 250, y: 338 },
  Y_AXIS_TITLE: { x: 20, y: 175 },
} as const;

const QUARTER_TURN_DEGREES = -90;
export const QUADRANT_Y_TITLE_TRANSFORM = `rotate(${String(QUARTER_TURN_DEGREES)} ${String(QUADRANT_ANCHOR.Y_AXIS_TITLE.x)} ${String(QUADRANT_ANCHOR.Y_AXIS_TITLE.y)})`;

/** Tokens of the chart furniture; resolved at runtime so the plot follows the theme. */
export const QUADRANT_TOKEN = {
  BAND_GOOD: '--evm-good-soft',
  BAND_BAD: '--evm-bad-soft',
  AXIS: '--line',
  REFERENCE: '--ink',
  AXIS_LABEL: '--ink-subtle',
  AXIS_TITLE: '--ink-muted',
  CHEAP: '--evm-good',
  EXPENSIVE: '--evm-bad',
  HALO: '--surface',
} as const;

/** A project exactly on both targets is neither favourable nor unfavourable: it is on plan. */
const ON_TARGET_TOKEN = '--accent';

const TONE_TOKENS: readonly string[] = Object.values(EVM_TONE_TOKENS).map(
  (tokens) => tokens.colorToken,
);

/** Every token the quadrant resolves; a stable array so the hook can memoize it. */
export const QUADRANT_COLOR_TOKENS: readonly string[] = [
  ...Object.values(QUADRANT_TOKEN),
  ...TONE_TOKENS,
  ON_TARGET_TOKEN,
];

export interface QuadrantBubbleModel {
  key: string;
  /** Two-digit number shared with the row of the dense list. */
  number: string;
  name: string;
  centerX: number;
  centerY: number;
  radius: number;
  colorToken: string;
  /** The indices fall outside the plot, so the bubble sits at the edge, marked with a dash. */
  isOffScale: boolean;
  /** The bubble sits on a reference line and needs a halo to keep its number readable. */
  needsHalo: boolean;
}

interface ClampedValue {
  value: number;
  clamped: boolean;
}

function clampToPlot(raw: number, min: number, max: number): ClampedValue {
  if (raw < min) {
    return { value: min, clamped: true };
  }
  if (raw > max) {
    return { value: max, clamped: true };
  }
  return { value: raw, clamped: false };
}

/**
 * Ink of a bubble, from the two statuses the report interpreted.
 *
 * Cost decides first, because the bands of the plot are the CPI: a project over budget is red
 * wherever its schedule stands. Two favourable statuses are favourable, two statuses exactly on
 * target take the teal of the brand, and a mixed reading stays amber — it is precisely the case
 * the reviewer must not read as good news.
 */
export function bubbleColorToken(indicators: EvmIndicators): string {
  const cost = costStatusTone(indicators.costStatus);
  const schedule = scheduleStatusTone(indicators.scheduleStatus);

  if (cost === EVM_TONE.NA || schedule === EVM_TONE.NA) {
    return EVM_TONE_TOKENS[EVM_TONE.NA].colorToken;
  }
  if (cost === EVM_TONE.BAD) {
    return EVM_TONE_TOKENS[EVM_TONE.BAD].colorToken;
  }
  if (cost !== schedule) {
    return EVM_TONE_TOKENS[EVM_TONE.NEUTRAL].colorToken;
  }
  return cost === EVM_TONE.NEUTRAL ? ON_TARGET_TOKEN : EVM_TONE_TOKENS[cost].colorToken;
}

/** Bubble radius for a budget, rounded to whole viewBox units. */
export function bubbleRadius(budgetAtCompletion: number): number {
  const span = BUBBLE_BUDGET_WINDOW.MAX - BUBBLE_BUDGET_WINDOW.MIN;
  const share = (budgetAtCompletion - BUBBLE_BUDGET_WINDOW.MIN) / span;
  const radius = BUBBLE_RADIUS.MIN + share * (BUBBLE_RADIUS.MAX - BUBBLE_RADIUS.MIN);
  return Math.round(Math.min(Math.max(radius, BUBBLE_RADIUS.MIN), BUBBLE_RADIUS.MAX));
}

interface BubblePosition {
  centerX: number;
  centerY: number;
  isOffScale: boolean;
}

/** Position of a (CPI, SPI) pair, clamped so a bubble can never be drawn outside the plot. */
export function bubblePosition(
  costPerformanceIndex: number,
  schedulePerformanceIndex: number,
  radius: number,
): BubblePosition {
  const rawX = QUADRANT_ORIGIN.X + (schedulePerformanceIndex - 1) * UNITS_PER_INDEX.X;
  const rawY = QUADRANT_ORIGIN.Y - (costPerformanceIndex - 1) * UNITS_PER_INDEX.Y;
  const inset = { x: radius + CLAMP_INSET.X, y: radius + CLAMP_INSET.Y };
  const x = clampToPlot(rawX, QUADRANT_PLOT.LEFT + inset.x, QUADRANT_PLOT.RIGHT - inset.x);
  const y = clampToPlot(rawY, QUADRANT_PLOT.TOP + inset.y, QUADRANT_PLOT.BOTTOM - inset.y);

  return {
    centerX: Math.round(x.value),
    centerY: Math.round(y.value),
    isOffScale: x.clamped || y.clamped,
  };
}

interface PlottableIndicators extends EvmIndicators {
  costPerformanceIndex: number;
  schedulePerformanceIndex: number;
}

/** Only a project with both indices can be a point; the rest are listed, never drawn. */
export function isPlottable(item: PortfolioItem): boolean {
  const { indicators } = item.entry;
  return (
    indicators !== null &&
    indicators.costPerformanceIndex !== null &&
    indicators.schedulePerformanceIndex !== null
  );
}

function plottableIndicators(item: PortfolioItem): PlottableIndicators | null {
  const { indicators } = item.entry;
  if (
    indicators === null ||
    indicators.costPerformanceIndex === null ||
    indicators.schedulePerformanceIndex === null
  ) {
    return null;
  }
  return {
    ...indicators,
    costPerformanceIndex: indicators.costPerformanceIndex,
    schedulePerformanceIndex: indicators.schedulePerformanceIndex,
  };
}

export function toQuadrantBubbles(items: readonly PortfolioItem[]): QuadrantBubbleModel[] {
  const bubbles: QuadrantBubbleModel[] = [];

  for (const item of items) {
    const indicators = plottableIndicators(item);
    if (indicators === null) {
      continue;
    }
    const radius = bubbleRadius(indicators.budgetAtCompletion);
    const position = bubblePosition(
      indicators.costPerformanceIndex,
      indicators.schedulePerformanceIndex,
      radius,
    );
    bubbles.push({
      ...position,
      key: item.entry.project.id,
      number: item.number,
      name: item.entry.project.name,
      radius,
      colorToken: bubbleColorToken(indicators),
      needsHalo: position.centerX === QUADRANT_ORIGIN.X || position.centerY === QUADRANT_ORIGIN.Y,
    });
  }

  return bubbles;
}
