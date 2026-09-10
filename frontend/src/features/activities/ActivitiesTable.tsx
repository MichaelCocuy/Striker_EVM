import { useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { BUTTON_VARIANT } from '@/components/ui/button-variants';
import { Card } from '@/components/ui/Card';
import { SkeletonLines } from '@/components/ui/Skeleton';
import { PERMISSIONS } from '@/features/auth/permissions';
import { useCan } from '@/features/auth/useCan';
import { useStaggerReveal } from '@/motion/useStaggerReveal';

import { ACTIVITIES_REVEAL_SELECTOR, TABLE_CLASS, TABLE_ROLE } from './activity-table';
import { ActivityDeleteDialog } from './ActivityDeleteDialog';
import { ActivityFormDialog } from './ActivityFormDialog';
import { ActivityRow } from './ActivityRow';
import { ActivityTableHead } from './ActivityTableHead';

import type { EvmActivityReport } from '@/api/types';
import type { HTMLAttributes } from 'react';

/** The card renders its own title, so the HTML `title` attribute is not accepted. */
export interface ActivitiesTableProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  projectId: string;
  /** Activities with their indicators, as the report returns them. */
  activities: readonly EvmActivityReport[];
  isLoading: boolean;
  /**
   * Called after a successful create, edit or delete so the dashboard refetches the report.
   * The table never recalculates an indicator locally.
   */
  onDataChanged: () => void;
  className?: string;
}

const COPY = {
  EYEBROW: 'Detalle',
  TITLE: 'Actividades',
  DESCRIPTION: 'Desviación frente al plan, avance real e indicadores por actividad.',
  CAPTION:
    'Actividades del proyecto con su avance, su costo y los indicadores EVM que devuelve el reporte.',
  EMPTY: 'Este proyecto todavía no tiene actividades.',
  CREATE: 'Nueva actividad',
  CREATE_FIRST: 'Crear la primera actividad',
} as const;

const SKELETON_LINES = 6;

const DIALOG_KIND = {
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
} as const;

type OpenDialog =
  | { kind: typeof DIALOG_KIND.CREATE }
  | { kind: typeof DIALOG_KIND.EDIT; activity: EvmActivityReport }
  | { kind: typeof DIALOG_KIND.DELETE; activity: EvmActivityReport };

/**
 * Activities table with the create, edit and delete flows (module M8).
 *
 * Contract: `onDataChanged` is the only way this component affects the rest of the dashboard.
 */
export function ActivitiesTable({
  projectId,
  activities,
  isLoading,
  onDataChanged,
  className = '',
  ...rest
}: ActivitiesTableProps) {
  const can = useCan();
  const [dialog, setDialog] = useState<OpenDialog | null>(null);
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  useStaggerReveal(bodyRef, {
    selector: ACTIVITIES_REVEAL_SELECTOR,
    revealKey: activities.map((activity) => activity.id).join(),
  });

  const canCreate = can(PERMISSIONS.ACTIVITY_CREATE);

  function openCreateDialog() {
    setDialog({ kind: DIALOG_KIND.CREATE });
  }

  function closeDialog() {
    setDialog(null);
  }

  function handleSaved() {
    setDialog(null);
    onDataChanged();
  }

  return (
    <Card
      eyebrow={COPY.EYEBROW}
      title={COPY.TITLE}
      description={COPY.DESCRIPTION}
      className={className}
      {...(canCreate ? { action: <Button onClick={openCreateDialog}>{COPY.CREATE}</Button> } : {})}
      {...rest}
    >
      {isLoading ? (
        <SkeletonLines count={SKELETON_LINES} />
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-ink-muted">{COPY.EMPTY}</p>
          {canCreate && (
            <Button variant={BUTTON_VARIANT.SECONDARY} onClick={openCreateDialog}>
              {COPY.CREATE_FIRST}
            </Button>
          )}
        </div>
      ) : (
        <div className={TABLE_CLASS.SCROLL_CONTAINER}>
          <table role={TABLE_ROLE.TABLE} className={TABLE_CLASS.TABLE}>
            <caption className={TABLE_CLASS.CAPTION}>{COPY.CAPTION}</caption>
            <ActivityTableHead />
            <tbody ref={bodyRef} role={TABLE_ROLE.ROW_GROUP} className={TABLE_CLASS.BODY}>
              {activities.map((activity) => (
                <ActivityRow
                  key={activity.id}
                  activity={activity}
                  onEdit={(target) => setDialog({ kind: DIALOG_KIND.EDIT, activity: target })}
                  onDelete={(target) => setDialog({ kind: DIALOG_KIND.DELETE, activity: target })}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialog?.kind === DIALOG_KIND.CREATE && (
        <ActivityFormDialog projectId={projectId} onClose={closeDialog} onSaved={handleSaved} />
      )}
      {dialog?.kind === DIALOG_KIND.EDIT && (
        <ActivityFormDialog
          projectId={projectId}
          activity={dialog.activity}
          onClose={closeDialog}
          onSaved={handleSaved}
        />
      )}
      {dialog?.kind === DIALOG_KIND.DELETE && (
        <ActivityDeleteDialog
          projectId={projectId}
          activity={dialog.activity}
          onClose={closeDialog}
          onDeleted={handleSaved}
        />
      )}
    </Card>
  );
}
