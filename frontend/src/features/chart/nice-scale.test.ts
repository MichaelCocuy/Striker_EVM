import { describe, expect, it } from 'vitest';

import { BARS } from './activity-bars-geometry';
import { EMPTY_SCALE, niceScale } from './nice-scale';

describe('niceScale', () => {
  it('leaves the fixture geometry exactly where the handoff draws it', () => {
    expect(niceScale(40000, BARS.TICK_COUNT)).toBe(40000);
  });

  it('rounds an awkward maximum up to a round tick', () => {
    expect(niceScale(37000, BARS.TICK_COUNT)).toBe(40000);
    expect(niceScale(5000, BARS.TICK_COUNT)).toBe(8000);
    expect(niceScale(900, BARS.TICK_COUNT)).toBe(1000);
  });

  it('never returns a scale below the largest figure it has to fit', () => {
    for (const maxValue of [900, 4321, 12345, 98765, 1234567]) {
      expect(niceScale(maxValue, BARS.TICK_COUNT)).toBeGreaterThanOrEqual(maxValue);
    }
  });

  it('has no scale at all when there is nothing to plot', () => {
    expect(niceScale(0, BARS.TICK_COUNT)).toBe(EMPTY_SCALE);
    expect(niceScale(-1, BARS.TICK_COUNT)).toBe(EMPTY_SCALE);
  });
});
