/**
 * Percent geometry of the two explanatory bar cards (modules M10 and M11).
 *
 * Both cards draw their bars as plain HTML boxes rather than SVG, so a width is a percent of
 * the track and a color can stay a `var(--token)`. Positioning a box is presentation: nothing
 * here derives an EVM value, it only maps money the report already brought onto a track.
 */

export const FULL_TRACK_PERCENT = 100;

/** The diverging ranking puts zero in the middle, so one side is half the track. */
export const HALF_TRACK_PERCENT = FULL_TRACK_PERCENT / 2;

export const EMPTY_FRACTION = 0;
const FULL_FRACTION = 1;

/**
 * Position of a value on a shared `0 … scale` money axis, clamped so a value cannot overflow
 * the track. A scale of zero (a project with no activities) leaves every bar empty.
 */
export function toScaleFraction(value: number, scale: number): number {
  if (scale <= EMPTY_FRACTION) {
    return EMPTY_FRACTION;
  }
  return Math.min(Math.max(value / scale, EMPTY_FRACTION), FULL_FRACTION);
}

/** CSS length for a percent of the track, ready for a `left` or a `width`. */
export function toPercentLength(percent: number): string {
  return `${String(percent)}%`;
}
