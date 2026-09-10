/**
 * Geometry of the per-activity CPI × SPI quadrant, in viewBox units (handoff §3.5).
 *
 * This is the same scatter language as the portfolio quadrant one level down, and it follows
 * the decisions `features/projects/portfolio-quadrant.ts` already made so the two read as one
 * system: coordinates rounded to whole viewBox units, an off-scale point nudged inside the
 * plot with a dashed outline and a caption rather than a broken scale, and a halo behind a
 * bubble whose centre lands on a reference line.
 *
 * The references are the two 1,0 of EVM: SPI 1,0 at x 190 and CPI 1,0 at y 147. The spans are
 * the handoff's, chosen so the fixture lands exactly where the deliverable draws it — Diseño
 * at (190, 94), Desarrollo at (114, 242) and Pruebas at (380, 52).
 */

export const QUADRANT = {
  VIEWBOX_WIDTH: 440,
  VIEWBOX_HEIGHT: 340,
  PLOT_LEFT: 50,
  PLOT_RIGHT: 400,
  PLOT_TOP: 40,
  PLOT_BOTTOM: 290,
  /** SPI 1,0 and CPI 1,0, the two references every bubble is read against. */
  REFERENCE_X: 190,
  REFERENCE_Y: 147,
  /** viewBox units per whole point of index. */
  SPI_SPAN: 380,
  CPI_SPAN: 475,
  REFERENCE_DASH: '4 4',
  BAND_GOOD_OPACITY: 0.3,
  BAND_BAD_OPACITY: 0.24,
  BUBBLE_STROKE_WIDTH: 1.5,
  /** Dashed outline of a bubble drawn at the plot edge instead of at its own coordinates. */
  OFF_SCALE_DASH: '3 3',
  /** Radius of the smallest activity, and how much the largest one adds to it. */
  RADIUS_BASE: 10,
  RADIUS_SPAN: 14,
  RADIUS_LARGE_THRESHOLD: 18,
  /** The name sits outside the bubble; this is the room its cap height needs above it. */
  NAME_GAP_Y: 8,
  NAME_ROOM_Y: 19,
  NAME_FONT_SIZE: 11.5,
  AMOUNT_OFFSET_Y: 3,
  AMOUNT_FONT_SIZE_SMALL: 8,
  AMOUNT_FONT_SIZE_LARGE: 10,
  LABEL_FONT_SIZE: 11,
  /** `CPI 1,0` goes inside the plot, where it cannot collide with the rotated axis title. */
  CPI_LABEL_X: 56,
  CPI_LABEL_Y: 142,
  SPI_LABEL_X: 194,
  SPI_LABEL_Y: 36,
  X_TITLE_X: 225,
  X_TITLE_Y: 320,
  Y_TITLE_X: 16,
  Y_TITLE_Y: 165,
  TITLE_FONT_SIZE: 11,
} as const;

/** The EVM reference both indices are compared with. */
export const INDEX_REFERENCE = 1;

/** An off-scale bubble is nudged this far inside the plot so its outline stays clear. */
const CLAMP_INSET = { X: 3, Y: 5 } as const;

const QUARTER_TURN_DEGREES = -90;

export const QUADRANT_VIEWBOX = `0 0 ${String(QUADRANT.VIEWBOX_WIDTH)} ${String(QUADRANT.VIEWBOX_HEIGHT)}`;

export const QUADRANT_Y_TITLE_TRANSFORM = `rotate(${String(QUARTER_TURN_DEGREES)} ${String(QUADRANT.Y_TITLE_X)} ${String(QUADRANT.Y_TITLE_Y)})`;

/** The green band covers CPI above the reference, the red band CPI below it. */
export const QUADRANT_BANDS = {
  GOOD: {
    y: QUADRANT.PLOT_TOP,
    height: QUADRANT.REFERENCE_Y - QUADRANT.PLOT_TOP,
    opacity: QUADRANT.BAND_GOOD_OPACITY,
  },
  BAD: {
    y: QUADRANT.REFERENCE_Y,
    height: QUADRANT.PLOT_BOTTOM - QUADRANT.REFERENCE_Y,
    opacity: QUADRANT.BAND_BAD_OPACITY,
  },
} as const;

export const PLOT_WIDTH = QUADRANT.PLOT_RIGHT - QUADRANT.PLOT_LEFT;

const NO_BUDGET = 0;

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
 * Bubble radius, proportional to the budget of the activity relative to the largest one of
 * the project. Here the radius may grow — there are only a handful of points, not eight —
 * and with the fixture (largest budget 40.000) it reproduces the handoff: 13,5 for the two
 * 10.000 activities and 24 for Desarrollo.
 */
export function quadrantRadius(budget: number, largestBudget: number): number {
  if (largestBudget <= NO_BUDGET) {
    return QUADRANT.RADIUS_BASE;
  }
  return QUADRANT.RADIUS_BASE + (budget / largestBudget) * QUADRANT.RADIUS_SPAN;
}

export interface BubblePosition {
  centerX: number;
  centerY: number;
  /** The indices fall outside the plot, so the bubble sits at the edge, marked with a dash. */
  isOffScale: boolean;
}

/**
 * Position of a (CPI, SPI) pair, clamped so a bubble can never be drawn outside the plot.
 * The vertical clamp also leaves room for the name written above the bubble.
 */
export function quadrantPosition(
  costPerformanceIndex: number,
  schedulePerformanceIndex: number,
  radius: number,
): BubblePosition {
  const rawX =
    QUADRANT.REFERENCE_X + (schedulePerformanceIndex - INDEX_REFERENCE) * QUADRANT.SPI_SPAN;
  const rawY = QUADRANT.REFERENCE_Y - (costPerformanceIndex - INDEX_REFERENCE) * QUADRANT.CPI_SPAN;
  const x = clampToPlot(
    rawX,
    QUADRANT.PLOT_LEFT + radius + CLAMP_INSET.X,
    QUADRANT.PLOT_RIGHT - radius - CLAMP_INSET.X,
  );
  const y = clampToPlot(
    rawY,
    radius + QUADRANT.NAME_ROOM_Y,
    QUADRANT.PLOT_BOTTOM - radius - CLAMP_INSET.Y,
  );

  return {
    centerX: Math.round(x.value),
    centerY: Math.round(y.value),
    isOffScale: x.clamped || y.clamped,
  };
}

/** Baseline of the name written above the bubble. */
export function quadrantNameY(centerY: number, radius: number): number {
  return centerY - radius - QUADRANT.NAME_GAP_Y;
}

/** A big bubble can carry a bigger figure inside it without touching its own edge. */
export function quadrantAmountFontSize(radius: number): number {
  return radius >= QUADRANT.RADIUS_LARGE_THRESHOLD
    ? QUADRANT.AMOUNT_FONT_SIZE_LARGE
    : QUADRANT.AMOUNT_FONT_SIZE_SMALL;
}
