import { describe, expect, it } from 'vitest';

import { COST_STATUS, SCHEDULE_STATUS } from '@/api/types';
import { EVM_TONE } from '@/evm/tone';
import { INDICATORS } from '@/features/evm-report/indicator-copy';
import { evmReportFixture } from '@/mocks/fixtures';

import { BRIDGE } from './bridge-geometry';
import { bridgeScale, toBridgeModel } from './bridge-rows';

const REPORT_INDICATORS = evmReportFixture.project.indicators;

/**
 * The handoff fixes this waterfall for the shared fixture (§3.3): bars 72px wide at
 * x 46 / 164 / 282 / 400 / 518, a baseline at y 200 and 1.000 worth 4,6875px, which makes
 * PV 150px tall, SV 14,1, EV 135,9, CV 11,7 and AC 147,6.
 */
describe('toBridgeModel with the shared EVM report fixture', () => {
  const model = toBridgeModel(REPORT_INDICATORS);

  it('decomposes PV into SV, EV, CV and AC, in that order', () => {
    expect(model.columns.map((column) => column.meta.acronym)).toEqual([
      INDICATORS.PLANNED_VALUE.acronym,
      INDICATORS.SCHEDULE_VARIANCE.acronym,
      INDICATORS.EARNED_VALUE.acronym,
      INDICATORS.COST_VARIANCE.acronym,
      INDICATORS.ACTUAL_COST.acronym,
    ]);
  });

  it('carries the reported figures unchanged', () => {
    expect(model.columns.map((column) => column.value)).toEqual([
      32000, -3000, 29000, -2500, 31500,
    ]);
    expect(bridgeScale(REPORT_INDICATORS)).toBe(32000);
  });

  it('puts every column where the handoff draws it', () => {
    expect(model.columns.map((column) => column.x)).toEqual([46, 164, 282, 400, 518]);

    /** Exact values; the handoff rounds them to 150 / 14,1 / 135,9 / 11,7 / 147,6. */
    expect(model.columns.map((column) => column.height)).toEqual([
      150, 14.0625, 135.9375, 11.71875, 147.65625,
    ]);
    expect(model.columns.map((column) => column.y)).toEqual([50, 50, 64.0625, 52.34375, 52.34375]);
  });

  it('makes an unfavourable cost jump rise from EV up to the level of AC', () => {
    const [, , earned, costJump] = model.columns;
    if (earned === undefined || costJump === undefined) {
      throw new Error('The bridge lost a column');
    }

    expect(costJump.reading?.tone).toBe(EVM_TONE.BAD);
    expect(costJump.gloss).toBe('sobrecosto');
    /** AC is above EV, so the jump ends where AC starts, not where EV does. */
    expect(costJump.y).toBeLessThan(earned.y);
  });

  it('joins the columns at the level they share', () => {
    expect(model.connectors).toHaveLength(4);
    expect(model.connectors.map((connector) => connector.x1)).toEqual([118, 236, 354, 472]);
    expect(model.connectors.map((connector) => connector.x2)).toEqual([164, 282, 400, 518]);
  });

  it('gives an anchor no direction of its own', () => {
    const [planned] = model.columns;
    expect(planned?.reading).toBeNull();
    expect(planned?.gloss).toBe('planificado');
  });

  it('keeps the baseline as the floor of every column', () => {
    for (const column of model.columns) {
      expect(column.y + column.height).toBeLessThanOrEqual(BRIDGE.BASELINE_Y);
    }
  });
});

describe('toBridgeModel with a favourable project', () => {
  it('drops a favourable cost jump and paints it green', () => {
    const model = toBridgeModel({
      ...REPORT_INDICATORS,
      earnedValue: 33000,
      actualCost: 30000,
      costVariance: 3000,
      scheduleVariance: 1000,
      costStatus: COST_STATUS.UNDER_BUDGET,
      scheduleStatus: SCHEDULE_STATUS.AHEAD_OF_SCHEDULE,
    });
    const [, scheduleJump, earned, costJump] = model.columns;
    if (scheduleJump === undefined || earned === undefined || costJump === undefined) {
      throw new Error('The bridge lost a column');
    }

    expect(scheduleJump.reading?.tone).toBe(EVM_TONE.GOOD);
    expect(scheduleJump.gloss).toBe('trabajo adelantado');
    expect(costJump.reading?.tone).toBe(EVM_TONE.GOOD);
    expect(costJump.gloss).toBe('ahorro');
    /** AC is below EV, so the jump starts at EV and falls towards AC. */
    expect(costJump.y).toBe(earned.y);
  });
});
