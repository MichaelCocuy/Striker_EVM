import { Button } from '@/components/ui/Button';
import { BUTTON_VARIANT } from '@/components/ui/button-variants';
import { PERMISSIONS } from '@/features/auth/permissions';
import { useCan } from '@/features/auth/useCan';

import {
  ActivityActionsCell,
  ActivityIndicatorCells,
  ActivityMeasureCells,
  ActivityNameCell,
  ActivityTextCell,
} from './activity-cells';
import {
  ACTIVITIES_REVEAL_ATTRIBUTE,
  ACTIVITY_COLUMN_LABELS,
  TABLE_CLASS,
  TABLE_ROLE,
} from './activity-table';

import type { OwnedActivity } from './useOwnedActivities';

const COPY = {
  EDIT: 'Editar',
} as const;

interface OwnedActivityRowProps {
  owned: OwnedActivity;
  onEdit: (owned: OwnedActivity) => void;
}

/**
 * One row of the registrar's cross-project table. Same treatment as the project table, with
 * the project the activity belongs to as an extra column.
 */
export function OwnedActivityRow({ owned, onEdit }: OwnedActivityRowProps) {
  const can = useCan();
  const { activity, project } = owned;

  return (
    <tr
      {...{ [ACTIVITIES_REVEAL_ATTRIBUTE]: true }}
      role={TABLE_ROLE.ROW}
      className={TABLE_CLASS.ROW}
    >
      <ActivityNameCell
        name={activity.name}
        owner={activity.owner}
        notes={activity.indicators.notes}
      />
      <ActivityTextCell label={ACTIVITY_COLUMN_LABELS.PROJECT} value={project.name} />
      <ActivityMeasureCells input={activity.input} indicators={activity.indicators} />
      <ActivityIndicatorCells indicators={activity.indicators} />
      <ActivityActionsCell>
        {can(PERMISSIONS.ACTIVITY_EDIT, activity) && (
          <Button
            variant={BUTTON_VARIANT.SECONDARY}
            aria-label={`${COPY.EDIT} ${activity.name}`}
            onClick={() => onEdit(owned)}
          >
            {COPY.EDIT}
          </Button>
        )}
      </ActivityActionsCell>
    </tr>
  );
}
