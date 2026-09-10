import { describe, expect, it } from 'vitest';

import { COST_STATUS, SCHEDULE_STATUS } from '@/api/types';
import { EVM_TONE } from '@/evm/tone';
import { evmReportFixture } from '@/mocks/fixtures';

import { QUADRANT } from './quadrant-geometry';
import { activityTone, toQuadrantModel } from './quadrant-points';

import type { EvmActivityReport } from '@/api/types';

const ACTIVITIES = evmReportFixture.activities;
const PROJECT_INDICATORS = evmReportFixture.project.indicators;

function withIndices(
  activity: EvmActivityReport,
  costPerformanceIndex: number | null,
  schedulePerformanceIndex: number | null,
): EvmActivityReport {
  return {
    ...activity,
    indicators: { ...activity.indicators, costPerformanceIndex, schedulePerformanceIndex },
  };
}

/**
 * The handoff fixes these bubbles for the shared fixture (§3.5): Diseño at (190, 94) r 13,5,
 * Desarrollo at (114, 242) r 24 and Pruebas at (380, 52) r 13,5.
 */
describe('toQuadrantModel with the shared EVM report fixture', () => {
  const { points, notPlotted, offScale } = toQuadrantModel(ACTIVITIES);

  it('plots the three activities where the handoff draws them', () => {
    expect(points).toHaveLength(ACTIVITIES.length);
    expect(notPlotted).toEqual([]);
    expect(offScale).toEqual([]);

    expect(points.map((point) => [point.centerX, point.centerY])).toEqual([
      [190, 94],
      [114, 242],
      [380, 52],
    ]);
    expect(points.map((point) => point.radius)).toEqual([13.5, 24, 13.5]);
  });

  it('takes the tone of the cost traffic light the report brings', () => {
    expect(points.map((point) => point.tone)).toEqual([EVM_TONE.GOOD, EVM_TONE.BAD, EVM_TONE.GOOD]);
  });

  it('haloes only the bubble that sits on a reference line', () => {
    expect(points.map((point) => point.hasHalo)).toEqual([true, false, false]);
    expect(points[0]?.centerX).toBe(QUADRANT.REFERENCE_X);
  });

  it('writes the budget inside the bubble, compact', () => {
    expect(points.map((point) => point.amount)).toEqual(['10 mil', '40 mil', '10 mil']);
  });

  it('puts the name above the bubble, outside its edge', () => {
    for (const point of points) {
      expect(point.nameY).toBeLessThan(point.centerY - point.radius);
    }
  });
});

describe('activityTone', () => {
  it('lets the cost traffic light decide, since the bands of the plot are the CPI', () => {
    expect(activityTone({ ...PROJECT_INDICATORS, costStatus: COST_STATUS.OVER_BUDGET })).toBe(
      EVM_TONE.BAD,
    );
    expect(
      activityTone({
        ...PROJECT_INDICATORS,
        costStatus: COST_STATUS.UNDER_BUDGET,
        scheduleStatus: SCHEDULE_STATUS.ON_SCHEDULE,
      }),
    ).toBe(EVM_TONE.GOOD);
  });

  it('downgrades money saved by not doing the work, which is not good news', () => {
    expect(
      activityTone({
        ...PROJECT_INDICATORS,
        costStatus: COST_STATUS.UNDER_BUDGET,
        scheduleStatus: SCHEDULE_STATUS.BEHIND_SCHEDULE,
      }),
    ).toBe(EVM_TONE.NEUTRAL);
  });
});

describe('toQuadrantModel with indices that are not computable', () => {
  it('leaves an activity without both indices out of the plot instead of drawing a zero', () => {
    const [design, development, testing] = ACTIVITIES;
    if (design === undefined || development === undefined || testing === undefined) {
      throw new Error('The fixture lost one of its activities');
    }

    const model = toQuadrantModel([
      withIndices(design, null, null),
      development,
      withIndices(testing, 1.2, null),
    ]);

    expect(model.points).toHaveLength(1);
    expect(model.points[0]?.name).toBe(development.name);
    expect(model.notPlotted).toEqual([design.name, testing.name]);
  });

  it('draws an off-scale activity at the edge and says its position is approximate', () => {
    const [design] = ACTIVITIES;
    if (design === undefined) {
      throw new Error('The fixture lost Diseño');
    }

    /** The four edge cases of "App móvil de campo": CPI 1,8125 with SPI 0,3452. */
    const model = toQuadrantModel([withIndices(design, 1.8125, 0.3452)]);
    const [point] = model.points;
    if (point === undefined) {
      throw new Error('The extreme activity was not plotted');
    }

    expect(point.isOffScale).toBe(true);
    expect(model.offScale).toEqual([design.name]);
    expect(point.centerX).toBeGreaterThanOrEqual(QUADRANT.PLOT_LEFT);
    expect(point.centerX).toBeLessThanOrEqual(QUADRANT.PLOT_RIGHT);
    expect(point.centerY).toBeLessThanOrEqual(QUADRANT.PLOT_BOTTOM);
    expect(point.nameY).toBeGreaterThan(0);
  });
});
