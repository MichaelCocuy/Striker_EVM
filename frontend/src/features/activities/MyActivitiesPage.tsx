import { useMemo, useRef, useState } from 'react';

import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonLines } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  COST_STATUS_LABEL,
  SCHEDULE_STATUS_LABEL,
  costStatusTone,
  scheduleStatusTone,
} from '@/evm/tone';
import { useAuth } from '@/features/auth/useAuth';
import { REVEAL_ATTRIBUTE } from '@/motion/constants';
import { useStaggerReveal } from '@/motion/useStaggerReveal';

import {
  ACTIVITIES_REVEAL_SELECTOR,
  ACTIVITY_COLUMN_LABELS,
  TABLE_CLASS,
  TABLE_ROLE,
} from './activity-table';
import { ActivityFormDialog } from './ActivityFormDialog';
import { ActivityTableHead } from './ActivityTableHead';
import { OwnedActivityRow } from './OwnedActivityRow';
import { ownedActivitiesOf, projectsOf, useProjectReports } from './useOwnedActivities';

import type { OwnedActivity } from './useOwnedActivities';

const COPY = {
  EYEBROW: 'Mi trabajo',
  TITLE: 'Mis actividades',
  DESCRIPTION: 'Actualiza el avance real y el costo real de las actividades a tu cargo.',
  ASSIGNED: {
    EYEBROW: 'Asignadas',
    TITLE: 'Actividades a mi cargo',
    DESCRIPTION: 'Desviación frente al plan, avance real e indicadores del reporte.',
    CAPTION: 'Actividades de las que soy responsable, con el proyecto al que pertenecen.',
    EMPTY: 'No tienes actividades asignadas.',
  },
  PROJECT_STATUS: {
    EYEBROW: 'Contexto',
    TITLE: 'Estado de mis proyectos',
    DESCRIPTION: 'Semáforo consolidado en modo lectura.',
    EMPTY: 'Aún no participas en ningún proyecto.',
  },
} as const;

const TABLE_SKELETON_LINES = 6;
const STATUS_SKELETON_LINES = 3;

/**
 * REGISTRAR home: the activities the signed-in user owns across every project they can see,
 * with the project's consolidated traffic light as read-only context.
 */
export function MyActivitiesPage() {
  const { user } = useAuth();
  const reports = useProjectReports();
  const [editing, setEditing] = useState<OwnedActivity | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  useStaggerReveal(gridRef);
  const bodyRef = useRef<HTMLTableSectionElement>(null);

  const ownerId = user?.id ?? null;
  const owned = useMemo(
    () => (ownerId === null ? [] : ownedActivitiesOf(reports.data ?? [], ownerId)),
    [reports.data, ownerId],
  );
  const projects = useMemo(() => projectsOf(owned), [owned]);

  useStaggerReveal(bodyRef, {
    selector: ACTIVITIES_REVEAL_SELECTOR,
    revealKey: owned.map(({ activity }) => activity.id).join(),
  });

  const isLoading = reports.status === 'loading';

  function handleSaved() {
    setEditing(null);
    reports.refetch();
  }

  return (
    <>
      <PageHeader
        eyebrow={COPY.EYEBROW}
        title={COPY.TITLE}
        description={user ? `${user.fullName} · ${COPY.DESCRIPTION}` : COPY.DESCRIPTION}
      />

      {reports.status === 'error' && reports.error && (
        <ErrorState message={reports.error.message} onRetry={reports.refetch} />
      )}

      <div ref={gridRef} className="grid gap-6 lg:grid-cols-3">
        <Card
          {...{ [REVEAL_ATTRIBUTE]: true }}
          eyebrow={COPY.ASSIGNED.EYEBROW}
          title={COPY.ASSIGNED.TITLE}
          description={COPY.ASSIGNED.DESCRIPTION}
          className="lg:col-span-2"
        >
          {isLoading ? (
            <SkeletonLines count={TABLE_SKELETON_LINES} />
          ) : owned.length === 0 ? (
            <p className="text-sm text-ink-muted">{COPY.ASSIGNED.EMPTY}</p>
          ) : (
            <div className={TABLE_CLASS.SCROLL_CONTAINER}>
              <table role={TABLE_ROLE.TABLE} className={TABLE_CLASS.TABLE}>
                <caption className={TABLE_CLASS.CAPTION}>{COPY.ASSIGNED.CAPTION}</caption>
                <ActivityTableHead contextColumnLabel={ACTIVITY_COLUMN_LABELS.PROJECT} />
                <tbody ref={bodyRef} role={TABLE_ROLE.ROW_GROUP} className={TABLE_CLASS.BODY}>
                  {owned.map((row) => (
                    <OwnedActivityRow key={row.activity.id} owned={row} onEdit={setEditing} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card
          {...{ [REVEAL_ATTRIBUTE]: true }}
          eyebrow={COPY.PROJECT_STATUS.EYEBROW}
          title={COPY.PROJECT_STATUS.TITLE}
          description={COPY.PROJECT_STATUS.DESCRIPTION}
        >
          {isLoading ? (
            <SkeletonLines count={STATUS_SKELETON_LINES} />
          ) : projects.length === 0 ? (
            <p className="text-sm text-ink-muted">{COPY.PROJECT_STATUS.EMPTY}</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {projects.map((project) => (
                <li key={project.id} className="flex flex-col gap-2">
                  <p className="font-medium text-ink">{project.name}</p>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill
                      tone={costStatusTone(project.indicators.costStatus)}
                      label={COST_STATUS_LABEL[project.indicators.costStatus]}
                    />
                    <StatusPill
                      tone={scheduleStatusTone(project.indicators.scheduleStatus)}
                      label={SCHEDULE_STATUS_LABEL[project.indicators.scheduleStatus]}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {editing !== null && (
        <ActivityFormDialog
          projectId={editing.project.id}
          activity={editing.activity}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
