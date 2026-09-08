import { Button } from '@/components/ui/Button';
import { BUTTON_VARIANT } from '@/components/ui/button-variants';
import { PERMISSIONS } from '@/features/auth/permissions';
import { useCan } from '@/features/auth/useCan';
import { formatPercent } from '@/lib/format';

import { ActivityIndicatorCells, ActivityStatusCell } from './activity-cells';
import { ACTIVITIES_REVEAL_ATTRIBUTE, TABLE_CLASS } from './activity-table';

import type { OwnedActivity } from './useOwnedActivities';

const COPY = {
  EDIT: 'Editar',
} as const;

interface OwnedActivityRowProps {
  owned: OwnedActivity;
  onEdit: (owned: OwnedActivity) => void;
}

/** One row of the registrar's cross-project table: the project it belongs to plus its numbers. */
export function OwnedActivityRow({ owned, onEdit }: OwnedActivityRowProps) {
  const can = useCan();
  const { activity, project } = owned;

  return (
    <tr {...{ [ACTIVITIES_REVEAL_ATTRIBUTE]: true }} className="border-t border-line">
      <th scope="row" className={TABLE_CLASS.NAME_CELL}>
        {activity.name}
      </th>
      <td className={TABLE_CLASS.CELL}>{project.name}</td>
      <td className={TABLE_CLASS.NUMERIC_CELL}>
        {formatPercent(activity.input.plannedProgressPercent)}
      </td>
      <td className={TABLE_CLASS.NUMERIC_CELL}>
        {formatPercent(activity.input.actualProgressPercent)}
      </td>
      <ActivityIndicatorCells indicators={activity.indicators} />
      <ActivityStatusCell indicators={activity.indicators} />
      <td className={TABLE_CLASS.CELL}>
        <div className="flex justify-end">
          {can(PERMISSIONS.ACTIVITY_EDIT, activity) && (
            <Button
              variant={BUTTON_VARIANT.SECONDARY}
              aria-label={`${COPY.EDIT} ${activity.name}`}
              onClick={() => onEdit(owned)}
            >
              {COPY.EDIT}
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
