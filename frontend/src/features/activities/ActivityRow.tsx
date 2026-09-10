import { Button } from '@/components/ui/Button';
import { BUTTON_VARIANT } from '@/components/ui/button-variants';
import { PERMISSIONS } from '@/features/auth/permissions';
import { useCan } from '@/features/auth/useCan';

import {
  ActivityActionsCell,
  ActivityIndicatorCells,
  ActivityMeasureCells,
  ActivityNameCell,
} from './activity-cells';
import { ACTIVITIES_REVEAL_ATTRIBUTE, TABLE_CLASS, TABLE_ROLE } from './activity-table';

import type { EvmActivityReport } from '@/api/types';

const COPY = {
  EDIT: 'Editar',
  DELETE: 'Eliminar',
} as const;

interface ActivityRowProps {
  activity: EvmActivityReport;
  onEdit: (activity: EvmActivityReport) => void;
  onDelete: (activity: EvmActivityReport) => void;
}

/**
 * One activity of the project table. Actions follow the permission matrix of ARQUITECTURA §11
 * (the backend still answers 403), so a registrar sees no action on someone else's activity.
 */
export function ActivityRow({ activity, onEdit, onDelete }: ActivityRowProps) {
  const can = useCan();
  const canEdit = can(PERMISSIONS.ACTIVITY_EDIT, activity);
  const canDelete = can(PERMISSIONS.ACTIVITY_DELETE, activity);

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
      <ActivityMeasureCells input={activity.input} indicators={activity.indicators} />
      <ActivityIndicatorCells indicators={activity.indicators} />
      <ActivityActionsCell>
        {canEdit && (
          <Button
            variant={BUTTON_VARIANT.SECONDARY}
            aria-label={`${COPY.EDIT} ${activity.name}`}
            onClick={() => onEdit(activity)}
          >
            {COPY.EDIT}
          </Button>
        )}
        {canDelete && (
          <Button
            variant={BUTTON_VARIANT.GHOST}
            aria-label={`${COPY.DELETE} ${activity.name}`}
            onClick={() => onDelete(activity)}
          >
            {COPY.DELETE}
          </Button>
        )}
      </ActivityActionsCell>
    </tr>
  );
}
