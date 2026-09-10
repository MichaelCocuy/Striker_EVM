import { describe, expect, it } from 'vitest';

import { COST_STATUS, SCHEDULE_STATUS } from '@/api/types';
import { evmReportFixture, projectFixture } from '@/mocks/fixtures';

import { portfolioFigures } from './portfolio-figures';

import type { PortfolioEntry } from './usePortfolio';
import type { CostStatus, EvmIndicators, ScheduleStatus } from '@/api/types';

/**
 * The eight seeded projects of backend/db/init.sql, with the consolidated values the report
 * returns for each of them. The strip only adds these up, so the totals can be checked by hand.
 */
const SEEDED = [
  {
    name: 'Portal de clientes',
    activityCount: 3,
    bac: 60000,
    ev: 29000,
    vac: -5172.41,
    cost: COST_STATUS.OVER_BUDGET,
    schedule: SCHEDULE_STATUS.BEHIND_SCHEDULE,
  },
  {
    name: 'Migración a la nube',
    activityCount: 3,
    bac: 40000,
    ev: 25600,
    vac: 5625,
    cost: COST_STATUS.UNDER_BUDGET,
    schedule: SCHEDULE_STATUS.AHEAD_OF_SCHEDULE,
  },
  {
    name: 'Integración de pagos',
    activityCount: 3,
    bac: 50000,
    ev: 22750,
    vac: -14835.16,
    cost: COST_STATUS.OVER_BUDGET,
    schedule: SCHEDULE_STATUS.AHEAD_OF_SCHEDULE,
  },
  {
    name: 'Rediseño del intranet',
    activityCount: 3,
    bac: 30000,
    ev: 12500,
    vac: 5280,
    cost: COST_STATUS.UNDER_BUDGET,
    schedule: SCHEDULE_STATUS.BEHIND_SCHEDULE,
  },
  {
    name: 'Cumplimiento normativo',
    activityCount: 3,
    bac: 40000,
    ev: 23000,
    vac: 0,
    cost: COST_STATUS.ON_BUDGET,
    schedule: SCHEDULE_STATUS.ON_SCHEDULE,
  },
  {
    name: 'App móvil de campo',
    activityCount: 4,
    bac: 43000,
    ev: 2900,
    vac: 19275.86,
    cost: COST_STATUS.UNDER_BUDGET,
    schedule: SCHEDULE_STATUS.BEHIND_SCHEDULE,
  },
  {
    name: 'Certificación ISO 27001',
    activityCount: 3,
    bac: 50000,
    ev: 50000,
    vac: -6000,
    cost: COST_STATUS.OVER_BUDGET,
    schedule: SCHEDULE_STATUS.ON_SCHEDULE,
  },
  {
    name: 'Tablero de indicadores',
    activityCount: 0,
    bac: 0,
    ev: 0,
    vac: null,
    cost: COST_STATUS.NOT_APPLICABLE,
    schedule: SCHEDULE_STATUS.NOT_APPLICABLE,
  },
] as const;

interface SeededProject {
  name: string;
  activityCount: number;
  bac: number;
  ev: number;
  vac: number | null;
  cost: CostStatus;
  schedule: ScheduleStatus;
}

function indicatorsOf(seeded: SeededProject): EvmIndicators {
  return {
    ...evmReportFixture.project.indicators,
    budgetAtCompletion: seeded.bac,
    earnedValue: seeded.ev,
    varianceAtCompletion: seeded.vac,
    costStatus: seeded.cost,
    scheduleStatus: seeded.schedule,
  };
}

function entryOf(seeded: SeededProject): PortfolioEntry {
  return {
    project: {
      ...projectFixture,
      id: seeded.name,
      name: seeded.name,
      activityCount: seeded.activityCount,
    },
    indicators: indicatorsOf(seeded),
  };
}

const SEEDED_ENTRIES: PortfolioEntry[] = SEEDED.map(entryOf);

describe('portfolioFigures', () => {
  it('adds up the reports of the eight seeded projects', () => {
    const figures = portfolioFigures(SEEDED_ENTRIES);

    expect(figures.totalBudget).toBe(313000);
    expect(figures.totalEarnedValue).toBe(165750);
    /** Over budget: 01, 03, 07 · behind schedule: 01, 04, 06 → five distinct projects. */
    expect(figures.redProjectCount).toBe(5);
    expect(figures.totalVarianceAtCompletion).toBeCloseTo(4173.29, 2);
    expect(figures.budgetedProjectCount).toBe(7);
  });

  it('skips a project whose report could not be read instead of counting it as zero', () => {
    const broken: PortfolioEntry = {
      project: { ...projectFixture, id: 'broken', name: 'Reporte caído', activityCount: 3 },
      indicators: null,
    };
    const figures = portfolioFigures([...SEEDED_ENTRIES, broken]);

    expect(figures.totalBudget).toBe(313000);
    expect(figures.redProjectCount).toBe(5);
    expect(figures.budgetedProjectCount).toBe(7);
  });

  it('leaves a total with nothing to add as null, so the strip can show a dash', () => {
    const withoutReports: PortfolioEntry[] = [{ project: projectFixture, indicators: null }];
    const figures = portfolioFigures(withoutReports);

    expect(figures.totalBudget).toBeNull();
    expect(figures.totalEarnedValue).toBeNull();
    expect(figures.totalVarianceAtCompletion).toBeNull();
    expect(figures.redProjectCount).toBe(0);
    expect(portfolioFigures([]).totalBudget).toBeNull();
  });

  it('never invents a VAC: a null variance is left out of the sum', () => {
    const onlyNullVariance = SEEDED_ENTRIES.filter(
      (entry) => entry.indicators?.varianceAtCompletion === null,
    );

    expect(onlyNullVariance).toHaveLength(1);
    expect(portfolioFigures(onlyNullVariance).totalVarianceAtCompletion).toBeNull();
  });
});
