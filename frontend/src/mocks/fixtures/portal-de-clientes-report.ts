import { COST_STATUS, SCHEDULE_STATUS } from '@/api/types';

import { SEED_IDS } from '../seed';

import type { EvmReport } from '@/api/types';

/**
 * Expected EVM report for the seeded project, copied verbatim from EVM_GUIA.md §6.5 and §6.6.
 * Nothing is computed here: the backend owns the EVM logic and this fixture is the oracle.
 */
export const PORTAL_DE_CLIENTES_REPORT: EvmReport = {
  project: {
    id: SEED_IDS.PROJECT,
    name: 'Portal de clientes',
    indicators: {
      budgetAtCompletion: 60000.0,
      plannedValue: 32000.0,
      earnedValue: 29000.0,
      actualCost: 31500.0,
      costVariance: -2500.0,
      scheduleVariance: -3000.0,
      costPerformanceIndex: 0.9206,
      schedulePerformanceIndex: 0.9063,
      estimateAtCompletion: 65172.41,
      varianceAtCompletion: -5172.41,
      costStatus: COST_STATUS.OVER_BUDGET,
      scheduleStatus: SCHEDULE_STATUS.BEHIND_SCHEDULE,
      notes: [],
    },
  },
  activities: [
    {
      id: SEED_IDS.ACTIVITY_DESIGN,
      name: 'Diseño',
      input: {
        name: 'Diseño',
        ownerId: SEED_IDS.REGISTRAR,
        budgetAtCompletion: 10000.0,
        plannedProgressPercent: 100.0,
        actualProgressPercent: 100.0,
        actualCost: 9000.0,
      },
      indicators: {
        budgetAtCompletion: 10000.0,
        plannedValue: 10000.0,
        earnedValue: 10000.0,
        actualCost: 9000.0,
        costVariance: 1000.0,
        scheduleVariance: 0.0,
        costPerformanceIndex: 1.1111,
        schedulePerformanceIndex: 1.0,
        estimateAtCompletion: 9000.0,
        varianceAtCompletion: 1000.0,
        costStatus: COST_STATUS.UNDER_BUDGET,
        scheduleStatus: SCHEDULE_STATUS.ON_SCHEDULE,
        notes: [],
      },
    },
    {
      id: SEED_IDS.ACTIVITY_DEVELOPMENT,
      name: 'Desarrollo',
      input: {
        name: 'Desarrollo',
        ownerId: SEED_IDS.REGISTRAR,
        budgetAtCompletion: 40000.0,
        plannedProgressPercent: 50.0,
        actualProgressPercent: 40.0,
        actualCost: 20000.0,
      },
      indicators: {
        budgetAtCompletion: 40000.0,
        plannedValue: 20000.0,
        earnedValue: 16000.0,
        actualCost: 20000.0,
        costVariance: -4000.0,
        scheduleVariance: -4000.0,
        costPerformanceIndex: 0.8,
        schedulePerformanceIndex: 0.8,
        estimateAtCompletion: 50000.0,
        varianceAtCompletion: -10000.0,
        costStatus: COST_STATUS.OVER_BUDGET,
        scheduleStatus: SCHEDULE_STATUS.BEHIND_SCHEDULE,
        notes: [],
      },
    },
    {
      id: SEED_IDS.ACTIVITY_TESTING,
      name: 'Pruebas',
      input: {
        name: 'Pruebas',
        ownerId: SEED_IDS.REGISTRAR_2,
        budgetAtCompletion: 10000.0,
        plannedProgressPercent: 20.0,
        actualProgressPercent: 30.0,
        actualCost: 2500.0,
      },
      indicators: {
        budgetAtCompletion: 10000.0,
        plannedValue: 2000.0,
        earnedValue: 3000.0,
        actualCost: 2500.0,
        costVariance: 500.0,
        scheduleVariance: 1000.0,
        costPerformanceIndex: 1.2,
        schedulePerformanceIndex: 1.5,
        estimateAtCompletion: 8333.33,
        varianceAtCompletion: 1666.67,
        costStatus: COST_STATUS.UNDER_BUDGET,
        scheduleStatus: SCHEDULE_STATUS.AHEAD_OF_SCHEDULE,
        notes: [],
      },
    },
  ],
};
