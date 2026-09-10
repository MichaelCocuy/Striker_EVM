import { Button } from '@/components/ui/Button';
import { BUTTON_VARIANT } from '@/components/ui/button-variants';
import { STATUS_PILL_SIZE } from '@/components/ui/status-pill-sizes';
import { StatusPill } from '@/components/ui/StatusPill';
import { PERMISSIONS } from '@/features/auth/permissions';
import { useCan } from '@/features/auth/useCan';
import { formatPercent } from '@/lib/format';

import { ACTIVITY_INDEX_COLUMNS, activityIndexChip } from './activity-index';
import { PROGRESS_COPY, PROGRESS_TRACK_SIZE } from './activity-progress';
import { ActivityProgressTrack } from './ActivityProgressTrack';

import type { OwnedActivity } from './useOwnedActivities';

const COPY = {
  REGISTER: 'Registrar',
  registerFor: (activityName: string) => `Registrar avance de ${activityName}`,
} as const;

const CARD_CLASS =
  'grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] items-center gap-3.5 rounded-lg border border-line p-4';

interface MyActivityCardProps {
  owned: OwnedActivity;
  onRegister: (owned: OwnedActivity) => void;
}

/**
 * One activity of the registrar, as a card instead of a table row: they do not compare
 * indicators, they update two numbers. The chips are there to say how the last calculation
 * went, and the button opens the entry panel.
 */
export function MyActivityCard({ owned, onRegister }: MyActivityCardProps) {
  const can = useCan();
  const { activity, project } = owned;

  return (
    <article className={CARD_CLASS}>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-heading text-body font-semibold text-ink">{activity.name}</span>
        <span className="text-caption text-ink-subtle">{project.name}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="flex justify-between gap-3 text-caption text-ink-muted">
          <span>
            {`${PROGRESS_COPY.PLANNED_SHORT} ${formatPercent(activity.input.plannedProgressPercent)}`}
          </span>
          <span>
            {`${PROGRESS_COPY.ACTUAL_SHORT} ${formatPercent(activity.input.actualProgressPercent)}`}
          </span>
        </p>
        <ActivityProgressTrack
          plannedPercent={activity.input.plannedProgressPercent}
          actualPercent={activity.input.actualProgressPercent}
          size={PROGRESS_TRACK_SIZE.CARD}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {ACTIVITY_INDEX_COLUMNS.map((index) => (
          <StatusPill
            key={index.key}
            {...activityIndexChip(index, activity.indicators, { withName: true })}
            size={STATUS_PILL_SIZE.FIGURE_SM}
          />
        ))}
      </div>

      <div className="flex justify-end">
        {can(PERMISSIONS.ACTIVITY_EDIT, activity) && (
          <Button
            variant={BUTTON_VARIANT.SECONDARY}
            aria-label={COPY.registerFor(activity.name)}
            onClick={() => onRegister(owned)}
          >
            {COPY.REGISTER}
          </Button>
        )}
      </div>
    </article>
  );
}
