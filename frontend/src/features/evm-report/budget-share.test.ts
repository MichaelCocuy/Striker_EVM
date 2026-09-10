import { describe, expect, it } from 'vitest';

import { evmReportFixture } from '@/mocks/fixtures';

import { budgetSharePercent } from './budget-share';

const PROJECT_BUDGET = evmReportFixture.project.indicators.budgetAtCompletion;

/** Desarrollo, the activity of the fixture that carries two thirds of the budget. */
const [, development] = evmReportFixture.activities;

describe('budgetSharePercent', () => {
  it('gives the share of the project budget the activity carries', () => {
    expect(budgetSharePercent(10000, PROJECT_BUDGET)).toBeCloseTo(16.6667, 4);
    expect(budgetSharePercent(40000, PROJECT_BUDGET)).toBeCloseTo(66.6667, 4);
  });

  it('reads the share of the heaviest activity of the shared fixture', () => {
    if (development === undefined) {
      throw new Error('The fixture has no Desarrollo activity');
    }

    const share = budgetSharePercent(development.indicators.budgetAtCompletion, PROJECT_BUDGET);

    expect(share).not.toBeNull();
    expect(share).toBeCloseTo(66.6667, 4);
  });

  it('is not computable when the project has no budget, and never zero', () => {
    expect(budgetSharePercent(10000, 0)).toBeNull();
    expect(budgetSharePercent(0, 0)).toBeNull();
  });
});
