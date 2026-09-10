import { describe, expect, it } from 'vitest';

import { evmReportFixture } from '@/mocks/fixtures';

import { activityBarsMax, toActivityBarRows } from './activity-bars';
import {
  axisTicks,
  BARS,
  barsPlotBottom,
  barsViewBox,
  barY,
  groupTop,
  moneyToWidth,
  moneyToX,
} from './activity-bars-geometry';
import { niceScale } from './nice-scale';

const ROWS = toActivityBarRows(evmReportFixture.activities);
const SCALE = niceScale(activityBarsMax(ROWS), BARS.TICK_COUNT);
const GROUP_COUNT = ROWS.length;

/**
 * The handoff fixes this geometry for the shared fixture (docs/.../README.md §3.4): the
 * money axis at x 70, 10.000 worth 110px, grid at x 180 / 290 / 400 / 510 and the three
 * activity groups at y 40 / 100 / 160.
 */
describe('activity bars geometry with the shared EVM report fixture', () => {
  it('takes the largest figure of the report, budgets included, as its scale', () => {
    expect(activityBarsMax(ROWS)).toBe(40000);
    expect(SCALE).toBe(40000);
  });

  it('maps 10.000 to 110px and puts the ticks where the handoff draws them', () => {
    expect(moneyToWidth(10000, SCALE)).toBe(110);
    expect(axisTicks(SCALE).map((tick) => tick.x)).toEqual([180, 290, 400, 510]);
    expect(axisTicks(SCALE).map((tick) => tick.value)).toEqual([10000, 20000, 30000, 40000]);
  });

  it('places the budget marker of Diseño at x 180 and of Desarrollo at x 510', () => {
    const [design, development] = ROWS;
    if (design === undefined || development === undefined) {
      throw new Error('The fixture lost one of its activities');
    }

    expect(moneyToX(design.budgetAtCompletion, SCALE)).toBe(180);
    expect(moneyToX(development.budgetAtCompletion, SCALE)).toBe(510);
  });

  it('stacks the three bars of a group 12px apart, in the bands of the handoff', () => {
    expect([0, 1, 2].map((index) => groupTop(index))).toEqual([40, 100, 160]);
    expect([0, 1, 2].map((series) => barY(0, series))).toEqual([40, 52, 64]);
    expect([0, 1, 2].map((series) => barY(1, series))).toEqual([100, 112, 124]);
  });

  it('grows its viewBox with the number of activities', () => {
    expect(barsPlotBottom(GROUP_COUNT)).toBe(220);
    expect(barsViewBox(GROUP_COUNT)).toBe('0 0 540 250');
    expect(barsViewBox(GROUP_COUNT + 1)).toBe('0 0 540 310');
  });

  it('clamps a figure that would leave the plot and never draws a negative width', () => {
    expect(moneyToWidth(SCALE * 2, SCALE)).toBe(BARS.PLOT_WIDTH);
    expect(moneyToWidth(-1000, SCALE)).toBe(0);
    expect(moneyToWidth(1000, 0)).toBe(0);
  });
});
