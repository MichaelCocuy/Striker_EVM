import { COST_STATUS, SCHEDULE_STATUS } from '@/api/types';

import type { PortfolioEntry } from './usePortfolio';
import type { EvmIndicators } from '@/api/types';

/**
 * Consolidated figures of the KPI strip.
 *
 * Nothing here is an EVM calculation: every term is a value `GET /projects/{id}/evm` already
 * returned, and the strip only adds up the reports of the visible projects and counts the
 * statuses the backend interpreted (design handoff, "2 · Portafolio": «Las cuatro se derivan
 * sumando los reportes de los proyectos visibles»).
 *
 * A `null` term is skipped instead of counted as zero, and a total with no term at all stays
 * `null` so the strip can show `—` rather than a fabricated zero.
 */
export interface PortfolioFigures {
  /** Sum of every readable BAC. */
  totalBudget: number | null;
  /** Sum of every readable EV. */
  totalEarnedValue: number | null;
  /** Projects the report marks as over budget or behind schedule. */
  redProjectCount: number;
  /** Sum of every readable VAC. */
  totalVarianceAtCompletion: number | null;
  /** Projects with activities that contributed to the budget total. */
  budgetedProjectCount: number;
}

type IndicatorPicker = (indicators: EvmIndicators) => number | null;

function sumIndicator(
  indicatorsList: readonly EvmIndicators[],
  pick: IndicatorPicker,
): number | null {
  const values = indicatorsList.map(pick).filter((value): value is number => value !== null);
  if (values.length === 0) {
    return null;
  }
  return values.reduce((total, value) => total + value, 0);
}

/** A project the reviewer has to look at: the report calls it over budget or behind schedule. */
function isRed(indicators: EvmIndicators): boolean {
  return (
    indicators.costStatus === COST_STATUS.OVER_BUDGET ||
    indicators.scheduleStatus === SCHEDULE_STATUS.BEHIND_SCHEDULE
  );
}

export function portfolioFigures(items: readonly PortfolioEntry[]): PortfolioFigures {
  const reported = items.filter((entry) => entry.indicators !== null);
  const indicatorsList = reported.map((entry) => entry.indicators).filter(isIndicators);

  return {
    totalBudget: sumIndicator(indicatorsList, (indicators) => indicators.budgetAtCompletion),
    totalEarnedValue: sumIndicator(indicatorsList, (indicators) => indicators.earnedValue),
    redProjectCount: indicatorsList.filter(isRed).length,
    totalVarianceAtCompletion: sumIndicator(
      indicatorsList,
      (indicators) => indicators.varianceAtCompletion,
    ),
    budgetedProjectCount: reported.filter((entry) => entry.project.activityCount > 0).length,
  };
}

/** Narrows the nullable field after the entries were filtered on it. */
function isIndicators(indicators: EvmIndicators | null): indicators is EvmIndicators {
  return indicators !== null;
}
