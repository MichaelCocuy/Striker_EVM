import { describe, expect, it } from 'vitest';

import { COST_STATUS } from '@/api/types';
import { EVM_TONE, EVM_TONE_LABEL } from '@/evm/tone';
import { emptyEvmReportFixture, evmReportFixture } from '@/mocks/fixtures';

import { COST_VARIANCE_READING } from './indicator-copy';
import { isNothingToEvaluate, readSign } from './report-reading';

const REPORT_INDICATORS = evmReportFixture.project.indicators;
const EMPTY_PROJECT_INDICATORS = emptyEvmReportFixture.project.indicators;

describe('readSign', () => {
  it('reads a negative variance as unfavourable and paints it red', () => {
    const reading = readSign(REPORT_INDICATORS.costVariance, COST_VARIANCE_READING);

    expect(REPORT_INDICATORS.costVariance).toBe(-2500);
    expect(reading.tone).toBe(EVM_TONE.BAD);
    expect(reading.label).toBe(COST_VARIANCE_READING.NEGATIVE);
  });

  it('reads a positive variance as favourable and a zero one as exact', () => {
    expect(readSign(1000, COST_VARIANCE_READING)).toEqual({
      tone: EVM_TONE.GOOD,
      label: COST_VARIANCE_READING.POSITIVE,
    });
    expect(readSign(0, COST_VARIANCE_READING)).toEqual({
      tone: EVM_TONE.NEUTRAL,
      label: COST_VARIANCE_READING.ZERO,
    });
  });

  it('reads a figure the report could not compute as "No aplica", never as zero', () => {
    const reading = readSign(null, COST_VARIANCE_READING);

    expect(reading.tone).toBe(EVM_TONE.NA);
    expect(reading.label).toBe(EVM_TONE_LABEL[EVM_TONE.NA]);
    expect(reading.label).not.toBe(COST_VARIANCE_READING.ZERO);
  });
});

describe('isNothingToEvaluate', () => {
  it('is true for the project without activities', () => {
    expect(isNothingToEvaluate(EMPTY_PROJECT_INDICATORS)).toBe(true);
  });

  it('is false for a project with figures to read', () => {
    expect(isNothingToEvaluate(REPORT_INDICATORS)).toBe(false);
  });

  it('is false when there is money even if no index is computable', () => {
    expect(
      isNothingToEvaluate({
        ...EMPTY_PROJECT_INDICATORS,
        budgetAtCompletion: 10000,
        plannedValue: 5000,
        costStatus: COST_STATUS.NOT_APPLICABLE,
      }),
    ).toBe(false);
  });
});
