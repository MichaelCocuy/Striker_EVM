/**
 * Rounded money scale for the axes of the charts.
 *
 * A plot whose top is the largest reported figure produces ticks such as "9,3 mil"; rounding
 * the step up to the next 1 / 2 / 2,5 / 5 / 10 of its magnitude keeps them readable. This is
 * axis arithmetic over figures the report already brought, not an EVM calculation.
 *
 * For the shared report fixture the largest figure is 40.000 across four ticks, so the step
 * lands on exactly 10.000 and the geometry matches the handoff tick for tick.
 */

const DECIMAL_BASE = 10;
export const EMPTY_SCALE = 0;

/** Steps a money axis is allowed to take, as multiples of the magnitude of the raw step. */
const NICE_MULTIPLE = {
  ONE: 1,
  TWO: 2,
  TWO_AND_A_HALF: 2.5,
  FIVE: 5,
  TEN: DECIMAL_BASE,
} as const;

const NICE_MULTIPLES: readonly number[] = Object.values(NICE_MULTIPLE);

/** Smallest allowed step that is not smaller than `rawStep`. */
function niceStep(rawStep: number): number {
  const magnitude = DECIMAL_BASE ** Math.floor(Math.log10(rawStep));
  const normalised = rawStep / magnitude;
  const multiple = NICE_MULTIPLES.find((candidate) => normalised <= candidate);
  return (multiple ?? NICE_MULTIPLE.TEN) * magnitude;
}

/**
 * Top of a money axis divided into `tickCount` equal steps, rounded up so every tick label
 * is a round number. A maximum of zero has no scale at all, which the caller reads as
 * "nothing to plot" instead of drawing an axis of zeros.
 */
export function niceScale(maxValue: number, tickCount: number): number {
  if (maxValue <= EMPTY_SCALE) {
    return EMPTY_SCALE;
  }
  return niceStep(maxValue / tickCount) * tickCount;
}
