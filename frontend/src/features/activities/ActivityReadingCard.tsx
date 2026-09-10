import { Button } from '@/components/ui/Button';
import { BUTTON_VARIANT } from '@/components/ui/button-variants';
import { Card } from '@/components/ui/Card';
import { PERMISSIONS } from '@/features/auth/permissions';
import { useCan } from '@/features/auth/useCan';
import { formatPercent } from '@/lib/format';

import { ACTIVITY_DETAIL_COPY, activityAlert } from './activity-detail';
import { DETAIL_TILE_INDICATORS } from './activity-indicators';
import { PROGRESS_COPY, PROGRESS_TRACK_SIZE } from './activity-progress';
import { ActivityAlert } from './ActivityAlert';
import { ActivityIndicatorTile } from './ActivityFigureTile';
import { ActivityProgressTrack } from './ActivityProgressTrack';

import type { EvmActivityReport } from '@/api/types';
import type { HTMLAttributes } from 'react';

const TILES_CLASS = 'grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3';

/** The card renders its own title, so the HTML `title` attribute is not accepted. */
interface ActivityReadingCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  activity: EvmActivityReport;
  onRegister: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Left card of the activity detail: the alert when there is one, the four figures that answer
 * "what was planned, what was earned, what it cost and where it lands", the progress against
 * the plan, and the actions the permission matrix of ARQUITECTURA §11 allows.
 */
export function ActivityReadingCard({
  activity,
  onRegister,
  onEdit,
  onDelete,
  ...rest
}: ActivityReadingCardProps) {
  const can = useCan();
  const alert = activityAlert(activity);
  const canEdit = can(PERMISSIONS.ACTIVITY_EDIT, activity);
  const canDelete = can(PERMISSIONS.ACTIVITY_DELETE, activity);

  return (
    <Card
      eyebrow={ACTIVITY_DETAIL_COPY.READING.EYEBROW}
      title={ACTIVITY_DETAIL_COPY.READING.TITLE}
      {...rest}
    >
      {alert !== null && <ActivityAlert reading={alert} />}

      <div className={TILES_CLASS}>
        {DETAIL_TILE_INDICATORS.map((indicator) => (
          <ActivityIndicatorTile
            key={indicator.key}
            indicator={indicator}
            indicators={activity.indicators}
          />
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="flex justify-between gap-4 text-caption text-ink-muted">
          <span>
            {`${PROGRESS_COPY.PLANNED} ${formatPercent(activity.input.plannedProgressPercent)}`}
          </span>
          <span>
            {`${PROGRESS_COPY.ACTUAL} ${formatPercent(activity.input.actualProgressPercent)}`}
          </span>
        </p>
        <ActivityProgressTrack
          plannedPercent={activity.input.plannedProgressPercent}
          actualPercent={activity.input.actualProgressPercent}
          size={PROGRESS_TRACK_SIZE.DETAIL}
        />
      </div>

      {(canEdit || canDelete) && (
        <footer className="flex flex-wrap items-center gap-3">
          {canEdit && (
            <>
              <Button onClick={onRegister}>{ACTIVITY_DETAIL_COPY.ACTIONS.REGISTER}</Button>
              <Button variant={BUTTON_VARIANT.SECONDARY} onClick={onEdit}>
                {ACTIVITY_DETAIL_COPY.ACTIONS.EDIT}
              </Button>
            </>
          )}
          {canDelete && (
            <Button variant={BUTTON_VARIANT.DANGER} onClick={onDelete}>
              {ACTIVITY_DETAIL_COPY.ACTIONS.DELETE}
            </Button>
          )}
        </footer>
      )}
    </Card>
  );
}
