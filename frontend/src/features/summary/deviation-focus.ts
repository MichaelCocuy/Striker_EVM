import { budgetSharePercent } from '@/features/evm-report/budget-share';
import { formatPercent, NOT_COMPUTABLE } from '@/lib/format';

import { DEVIATION_FOCUS_COPY } from './band-copy';

import type { EvmActivityReport, EvmIndicators } from '@/api/types';

/**
 * Which activity carries the deviation at closing, in one sentence.
 *
 * Contract: the variance at completion and both budgets come from the report. Comparing a
 * reported variance with zero, ordering by it and dividing two reported budgets is
 * presentation (handoff §3.6); no EVM indicator is derived here.
 */

const ADVERSE_THRESHOLD = 0;
const SINGLE_ACTIVITY = 1;

interface AdverseActivity {
  name: string;
  varianceAtCompletion: number;
  budgetAtCompletion: number;
}

/** Activities the report says will close over their own budget, worst first. */
function adverseActivities(activities: readonly EvmActivityReport[]): AdverseActivity[] {
  return activities
    .flatMap((activity) => {
      const { varianceAtCompletion, budgetAtCompletion } = activity.indicators;
      if (varianceAtCompletion === null || varianceAtCompletion >= ADVERSE_THRESHOLD) {
        return [];
      }
      return [{ name: activity.name, varianceAtCompletion, budgetAtCompletion }];
    })
    .sort((left, right) => left.varianceAtCompletion - right.varianceAtCompletion);
}

function hasComputableForecast(activities: readonly EvmActivityReport[]): boolean {
  return activities.some((activity) => activity.indicators.varianceAtCompletion !== null);
}

/** Share of the project budget as text, or the not-computable mark. */
function readShare(activityBudget: number, projectBudget: number): string {
  const share = budgetSharePercent(activityBudget, projectBudget);
  return share === null ? NOT_COMPUTABLE : formatPercent(share);
}

export function readDeviationFocus(
  indicators: EvmIndicators,
  activities: readonly EvmActivityReport[],
): string {
  if (!hasComputableForecast(activities)) {
    return DEVIATION_FOCUS_COPY.NOT_COMPUTABLE;
  }

  const adverse = adverseActivities(activities);
  const [worst] = adverse;
  if (worst === undefined) {
    return DEVIATION_FOCUS_COPY.NONE;
  }

  const share = readShare(worst.budgetAtCompletion, indicators.budgetAtCompletion);
  const wording =
    adverse.length === SINGLE_ACTIVITY
      ? DEVIATION_FOCUS_COPY.ONLY_ADVERSE
      : DEVIATION_FOCUS_COPY.WORST;
  return wording(worst.name, share);
}
