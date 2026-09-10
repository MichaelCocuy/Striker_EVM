import { formatMoney, formatPercent } from '@/lib/format';

import { projectsOf } from './useOwnedActivities';

import type { OwnedActivity } from './useOwnedActivities';

export interface BehindPlanSummary {
  count: number;
  /** The activity furthest behind its plan, to name it in the KPI's caption. */
  worst: OwnedActivity | null;
}

export interface OwnedActivitiesSummary {
  activityCount: number;
  projectCount: number;
  behindPlan: BehindPlanSummary;
  /** Earned value of the user's own activities, and of the projects they work in. */
  earnedValue: { own: number; projects: number };
}

const NONE = 0;

/** How far the real progress is behind the planned one, both reported at the cut-off date. */
function planGap({ activity }: OwnedActivity): number {
  return activity.input.plannedProgressPercent - activity.input.actualProgressPercent;
}

function behindPlanSummary(owned: readonly OwnedActivity[]): BehindPlanSummary {
  const behind = owned.filter((row) => planGap(row) > NONE);
  const worst = behind.reduce<OwnedActivity | null>(
    (furthest, candidate) =>
      furthest === null || planGap(candidate) > planGap(furthest) ? candidate : furthest,
    null,
  );
  return { count: behind.length, worst };
}

/**
 * The three figures of the KPI strip of «Mis actividades».
 *
 * Every number is either a count of rows or a sum of reported figures: adding up the earned
 * value the report already calculated is presentation arithmetic, the same kind the dashboard
 * does to weigh one activity against its project. No EVM indicator is derived here.
 */
export function ownedActivitiesSummary(owned: readonly OwnedActivity[]): OwnedActivitiesSummary {
  const projects = projectsOf(owned);
  return {
    activityCount: owned.length,
    projectCount: projects.length,
    behindPlan: behindPlanSummary(owned),
    earnedValue: {
      own: owned.reduce((total, { activity }) => total + activity.indicators.earnedValue, NONE),
      projects: projects.reduce((total, project) => total + project.indicators.earnedValue, NONE),
    },
  };
}

export const MY_ACTIVITIES_KPI_COPY = {
  ASSIGNED: {
    LABEL: 'A mi cargo',
    caption: ({ activityCount, projectCount }: OwnedActivitiesSummary) =>
      `${activityCount === 1 ? 'actividad' : 'actividades'} en ${projectCount} ${
        projectCount === 1 ? 'proyecto' : 'proyectos'
      }`,
  },
  BEHIND_PLAN: {
    LABEL: 'Por debajo del plan',
    ON_TRACK: 'ninguna actividad va por detrás de su plan',
    caption: ({ behindPlan }: OwnedActivitiesSummary) => {
      if (behindPlan.worst === null) {
        return MY_ACTIVITIES_KPI_COPY.BEHIND_PLAN.ON_TRACK;
      }
      const { name, input } = behindPlan.worst.activity;
      return `${name} · avance real ${formatPercent(input.actualProgressPercent)} frente al ${formatPercent(input.plannedProgressPercent)} del plan`;
    },
  },
  EARNED_VALUE: {
    LABEL: 'Mi aporte al EV',
    caption: ({ earnedValue }: OwnedActivitiesSummary) =>
      `de ${formatMoney(earnedValue.projects)} de mis proyectos`,
  },
} as const;
