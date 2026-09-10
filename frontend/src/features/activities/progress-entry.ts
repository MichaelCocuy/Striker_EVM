import { activityDeviation, DEVIATION_DIRECTION } from './activity-deviation';
import { activityFormValuesFrom, buildActivityInput, parseDecimalInput } from './activity-form';

import type { DeviationDirection } from './activity-deviation';
import type { ActivityInputOptions, ActivityInputResult } from './activity-form';
import type { ActivityMeasures, EvmActivityReport } from '@/api/types';

/** The two raw numbers the registrar updates, kept as text so a failed submit survives. */
export interface ProgressDraft {
  actualProgressPercent: string;
  actualCost: string;
}

/** Bounds of the slider; the percentage is a bounded quantity, so a slider is its control. */
export const PROGRESS_SLIDER = {
  MIN: 0,
  MAX: 100,
  STEP: 1,
} as const;

export function progressDraftFrom(activity: EvmActivityReport): ProgressDraft {
  return {
    actualProgressPercent: String(activity.input.actualProgressPercent),
    actualCost: String(activity.input.actualCost),
  };
}

/**
 * Request body of `PUT /projects/{id}/activities/{aid}`: the panel only moves the two raw
 * numbers, so name, owner, BAC and planned progress travel unchanged, and the same validation
 * of `activity-form.ts` applies.
 */
export function buildProgressInput(
  activity: EvmActivityReport,
  draft: ProgressDraft,
  options: ActivityInputOptions,
): ActivityInputResult {
  return buildActivityInput({ ...activityFormValuesFrom(activity), ...draft }, options);
}

/** The stored measures with the drafted real progress, for the bar the panel paints live. */
export function draftMeasures(activity: EvmActivityReport, draft: ProgressDraft): ActivityMeasures {
  const percent = parseDecimalInput(draft.actualProgressPercent);
  return {
    ...activity.input,
    actualProgressPercent: percent ?? activity.input.actualProgressPercent,
  };
}

/**
 * What the drafted progress means against the plan, in words.
 *
 * This compares two percentages, which is presentation: no EVM indicator is estimated here.
 * EV, CPI, SPI and EAC are not previewed as numbers on purpose — see the panel.
 */
const DRAFT_READING: Record<DeviationDirection, string> = {
  [DEVIATION_DIRECTION.ABOVE]:
    'Con este avance la actividad queda por delante del plan a la fecha de corte.',
  [DEVIATION_DIRECTION.ON_PLAN]:
    'Con este avance la actividad queda justo en el plan a la fecha de corte.',
  [DEVIATION_DIRECTION.BELOW]:
    'Con este avance la actividad queda por detrás del plan a la fecha de corte.',
};

export function draftProgressReading(activity: EvmActivityReport, draft: ProgressDraft): string {
  return DRAFT_READING[activityDeviation(draftMeasures(activity, draft)).direction];
}
