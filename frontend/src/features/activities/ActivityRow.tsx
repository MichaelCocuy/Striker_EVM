import { Button } from '@/components/ui/Button';
import { BUTTON_VARIANT } from '@/components/ui/button-variants';
import { PERMISSIONS } from '@/features/auth/permissions';
import { useCan } from '@/features/auth/useCan';
import { formatPercent } from '@/lib/format';

import { ActivityIndicatorCells, ActivityStatusCell } from './activity-cells';
import { ACTIVITIES_REVEAL_ATTRIBUTE, TABLE_CLASS } from './activity-table';

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
    <tr {...{ [ACTIVITIES_REVEAL_ATTRIBUTE]: true }} className="border-t border-line">
      <th scope="row" className={TABLE_CLASS.NAME_CELL}>
        <span>{activity.name}</span>
        {activity.indicators.notes.length > 0 && (
          <ul className="mt-1 flex flex-col gap-0.5 text-xs font-normal text-ink-subtle">
            {activity.indicators.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        )}
      </th>
      <td className={TABLE_CLASS.CELL}>{activity.owner.fullName}</td>
      <td className={TABLE_CLASS.NUMERIC_CELL}>
        {formatPercent(activity.input.plannedProgressPercent)}
      </td>
      <td className={TABLE_CLASS.NUMERIC_CELL}>
        {formatPercent(activity.input.actualProgressPercent)}
      </td>
      <ActivityIndicatorCells indicators={activity.indicators} />
      <ActivityStatusCell indicators={activity.indicators} />
      <td className={TABLE_CLASS.CELL}>
        <div className="flex justify-end gap-2">
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
        </div>
      </td>
    </tr>
  );
}
