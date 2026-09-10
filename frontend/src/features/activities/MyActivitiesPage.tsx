import { useMemo, useRef, useState } from 'react';

import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonLines } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth/useAuth';
import { REVEAL_ATTRIBUTE } from '@/motion/constants';
import { useStaggerReveal } from '@/motion/useStaggerReveal';

import { ActivityProgressPanel } from './ActivityProgressPanel';
import { ownedActivitiesSummary } from './my-activities-summary';
import { MyActivitiesKpiStrip } from './MyActivitiesKpiStrip';
import { MyActivityCard } from './MyActivityCard';
import { ownedActivitiesOf, useProjectReports } from './useOwnedActivities';

import type { OwnedActivity } from './useOwnedActivities';

const COPY = {
  EYEBROW: 'Mi trabajo',
  TITLE: 'Mis actividades',
  DESCRIPTION: 'Actualiza el avance real y el costo real de las actividades a tu cargo.',
  ASSIGNED: {
    EYEBROW: 'Asignadas',
    TITLE: 'Actividades a mi cargo',
    DESCRIPTION:
      'Actualiza el avance real y el costo. Los indicadores los recalcula el servidor al guardar.',
    EMPTY: 'No tienes actividades asignadas.',
  },
} as const;

const SKELETON_LINES = 6;

/**
 * REGISTRAR home: the activities the signed-in user owns across every project they can see.
 *
 * The thirteen-column table of the previous iteration is gone: a registrar does not compare
 * indicators, so each activity reads as a card with its progress against the plan, the two
 * indices of the last calculation and the button that opens the entry panel.
 */
export function MyActivitiesPage() {
  const { user } = useAuth();
  const reports = useProjectReports();
  const [registering, setRegistering] = useState<OwnedActivity | null>(null);

  const layoutRef = useRef<HTMLDivElement>(null);

  const ownerId = user?.id ?? null;
  const owned = useMemo(
    () => (ownerId === null ? [] : ownedActivitiesOf(reports.data ?? [], ownerId)),
    [reports.data, ownerId],
  );
  const summary = useMemo(() => ownedActivitiesSummary(owned), [owned]);

  useStaggerReveal(layoutRef, {
    revealKey: owned.map(({ activity }) => activity.id).join(),
  });

  const isLoading = reports.status === 'loading';

  function handleSaved() {
    setRegistering(null);
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

      <div ref={layoutRef} className="flex flex-col gap-4">
        <MyActivitiesKpiStrip summary={summary} />

        <Card
          {...{ [REVEAL_ATTRIBUTE]: true }}
          eyebrow={COPY.ASSIGNED.EYEBROW}
          title={COPY.ASSIGNED.TITLE}
          description={COPY.ASSIGNED.DESCRIPTION}
        >
          {isLoading ? (
            <SkeletonLines count={SKELETON_LINES} />
          ) : owned.length === 0 ? (
            <p className="text-small text-ink-muted">{COPY.ASSIGNED.EMPTY}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {owned.map((row) => (
                <li key={row.activity.id}>
                  <MyActivityCard owned={row} onRegister={setRegistering} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {registering !== null && (
        <ActivityProgressPanel
          projectId={registering.project.id}
          projectName={registering.project.name}
          activity={registering.activity}
          onClose={() => setRegistering(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
