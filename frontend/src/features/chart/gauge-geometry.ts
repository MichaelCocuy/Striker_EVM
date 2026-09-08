import { formatNumber } from '@/lib/format';

/**
 * Geometry of the semicircular index gauge, in viewBox units.
 *
 * The scale runs from 0 to 2 so the EVM reference, 1.0, sits exactly at the top of the arc;
 * the reference mark is still derived from `REFERENCE` instead of assuming the top.
 */

export const GAUGE_SCALE = {
  MIN: 0,
  MAX: 2,
  REFERENCE: 1,
} as const;

/** The arc spans half a turn: fraction 0 is its left end and fraction 1 its right end. */
const EMPTY_ARC_FRACTION = 0;
const FULL_ARC_FRACTION = 1;
const HALF_TURN_DEGREES = 180;
const DEGREES_TO_RADIANS = Math.PI / HALF_TURN_DEGREES;

export const GAUGE_VIEWBOX = { WIDTH: 200, HEIGHT: 114 } as const;

export const GAUGE_ARC = {
  CENTER_X: 100,
  CENTER_Y: 108,
  RADIUS: 86,
  TRACK_WIDTH: 12,
  /** Radii the reference mark is drawn between, and the one its label sits on. */
  MARK_INNER_RADIUS: 78,
  MARK_OUTER_RADIUS: 94,
  MARK_WIDTH: 2,
  MARK_LABEL_RADIUS: 98,
  MARK_LABEL_FONT_SIZE: 10,
} as const;

/** The reference reads as a scale mark ("1,0"), not as an indicator value. */
const REFERENCE_LABEL_DECIMALS = 1;
export const GAUGE_REFERENCE_LABEL = formatNumber(GAUGE_SCALE.REFERENCE, REFERENCE_LABEL_DECIMALS);

/** SVG `pathLength` normalises the arc to 1 unit so a dash array can reveal a fraction. */
export const NORMALISED_PATH_LENGTH = FULL_ARC_FRACTION;

export interface ArcPoint {
  x: number;
  y: number;
}

export function pointOnArc(fraction: number, radius: number): ArcPoint {
  const angleRadians = (HALF_TURN_DEGREES - fraction * HALF_TURN_DEGREES) * DEGREES_TO_RADIANS;
  return {
    x: GAUGE_ARC.CENTER_X + radius * Math.cos(angleRadians),
    y: GAUGE_ARC.CENTER_Y - radius * Math.sin(angleRadians),
  };
}

/** Full half-turn path, shared by the track and the painted value arc. */
export const GAUGE_ARC_PATH = ((): string => {
  const { RADIUS } = GAUGE_ARC;
  const start = pointOnArc(EMPTY_ARC_FRACTION, RADIUS);
  const end = pointOnArc(FULL_ARC_FRACTION, RADIUS);
  return `M ${String(start.x)} ${String(start.y)} A ${String(RADIUS)} ${String(RADIUS)} 0 0 1 ${String(end.x)} ${String(end.y)}`;
})();

/** Position of a value on the 0-2 scale, clamped so an extreme index cannot overflow the arc. */
export function toArcFraction(value: number): number {
  const fraction = (value - GAUGE_SCALE.MIN) / (GAUGE_SCALE.MAX - GAUGE_SCALE.MIN);
  return Math.min(Math.max(fraction, EMPTY_ARC_FRACTION), FULL_ARC_FRACTION);
}

export const REFERENCE_FRACTION = toArcFraction(GAUGE_SCALE.REFERENCE);
