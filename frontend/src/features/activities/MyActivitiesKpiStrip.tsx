import { formatMoney } from '@/lib/format';
import { REVEAL_ATTRIBUTE } from '@/motion/constants';

import { MY_ACTIVITIES_KPI_COPY } from './my-activities-summary';

import type { OwnedActivitiesSummary } from './my-activities-summary';

const STRIP_CLASS = 'grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5';
const TILE_CLASS = 'rounded-lg border border-line bg-surface p-4 shadow-low';

/** The count of activities behind their plan is the only figure that wears a warning tint. */
const FIGURE_CLASS = {
  PLAIN: 'text-ink',
  WARNING: 'text-evm-neutral',
} as const;

const NONE = 0;

interface KpiTileProps {
  label: string;
  value: string;
  caption: string;
  figureClass?: string;
}

function KpiTile({ label, value, caption, figureClass = FIGURE_CLASS.PLAIN }: KpiTileProps) {
  return (
    <div {...{ [REVEAL_ATTRIBUTE]: true }} className={TILE_CLASS}>
      <p className="eyebrow">{label}</p>
      <p className={`numeric text-figure-lg ${figureClass}`}>{value}</p>
      <p className="text-caption text-ink-subtle">{caption}</p>
    </div>
  );
}

interface MyActivitiesKpiStripProps {
  summary: OwnedActivitiesSummary;
}

/**
 * The three figures the registrar reads before touching anything: how much is theirs, what is
 * falling behind its plan and how much of the projects' earned value they answer for.
 */
export function MyActivitiesKpiStrip({ summary }: MyActivitiesKpiStripProps) {
  const { ASSIGNED, BEHIND_PLAN, EARNED_VALUE } = MY_ACTIVITIES_KPI_COPY;

  return (
    <div className={STRIP_CLASS}>
      <KpiTile
        label={ASSIGNED.LABEL}
        value={String(summary.activityCount)}
        caption={ASSIGNED.caption(summary)}
      />
      <KpiTile
        label={BEHIND_PLAN.LABEL}
        value={String(summary.behindPlan.count)}
        caption={BEHIND_PLAN.caption(summary)}
        figureClass={summary.behindPlan.count > NONE ? FIGURE_CLASS.WARNING : FIGURE_CLASS.PLAIN}
      />
      <KpiTile
        label={EARNED_VALUE.LABEL}
        value={formatMoney(summary.earnedValue.own)}
        caption={EARNED_VALUE.caption(summary)}
      />
    </div>
  );
}
