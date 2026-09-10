import { useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { BUTTON_VARIANT } from '@/components/ui/button-variants';
import { Card } from '@/components/ui/Card';
import { ICON_SIZE, ICON_STROKE, Plus } from '@/components/ui/icons';
import { SkeletonLines } from '@/components/ui/Skeleton';
import { PERMISSIONS } from '@/features/auth/permissions';
import { useCan } from '@/features/auth/useCan';
import { useStaggerReveal } from '@/motion/useStaggerReveal';

import { ACTIVITIES_REVEAL_SELECTOR, TABLE_CLASS, TABLE_ROLE } from './activity-table';
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
   * Called after a successful create so the dashboard refetches the report.
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
    'Actividades del proyecto con su avance, su costo y los indicadores EVM que devuelve el reporte. Cada fila lleva al detalle de la actividad.',
  EMPTY: 'Este proyecto todavía no tiene actividades.',
  CREATE: 'Nueva actividad',
  CREATE_FIRST: 'Crear la primera actividad',
} as const;

const SKELETON_LINES = 6;

/**
 * Activities table of the project dashboard (module M8), in the nine-column row of the
 * redesign. Editing, deleting and registering progress live in the activity detail, which is
 * where every row leads.
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
  const [isCreating, setIsCreating] = useState(false);
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  useStaggerReveal(bodyRef, {
    selector: ACTIVITIES_REVEAL_SELECTOR,
    revealKey: activities.map((activity) => activity.id).join(),
  });

  const canCreate = can(PERMISSIONS.ACTIVITY_CREATE);

  function openCreateDialog() {
    setIsCreating(true);
  }

  function closeCreateDialog() {
    setIsCreating(false);
  }

  function handleSaved() {
    setIsCreating(false);
    onDataChanged();
  }

  return (
    <Card
      eyebrow={COPY.EYEBROW}
      title={COPY.TITLE}
      description={COPY.DESCRIPTION}
      className={className}
      {...(canCreate
        ? {
            action: (
              <Button
                onClick={openCreateDialog}
                icon={
                  <Plus aria-hidden="true" size={ICON_SIZE.COMPACT} strokeWidth={ICON_STROKE.UI} />
                }
              >
                {COPY.CREATE}
              </Button>
            ),
          }
        : {})}
      {...rest}
    >
      {isLoading ? (
        <SkeletonLines count={SKELETON_LINES} />
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-small text-ink-muted">{COPY.EMPTY}</p>
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
                <ActivityRow key={activity.id} projectId={projectId} activity={activity} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isCreating && (
        <ActivityFormDialog
          projectId={projectId}
          onClose={closeCreateDialog}
          onSaved={handleSaved}
        />
      )}
    </Card>
  );
}
