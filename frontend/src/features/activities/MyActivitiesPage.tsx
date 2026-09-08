import { useRef } from 'react';

import { PageHeader } from '@/components/ui/PageHeader';
import { PlaceholderCard } from '@/components/ui/PlaceholderCard';
import { Skeleton, SkeletonLines } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth/useAuth';
import { REVEAL_ATTRIBUTE } from '@/motion/constants';
import { useStaggerReveal } from '@/motion/useStaggerReveal';

const COPY = {
  EYEBROW: 'Mi trabajo',
  TITLE: 'Mis actividades',
  DESCRIPTION: 'Actualiza el avance real y el costo real de las actividades a tu cargo.',
  ASSIGNED: {
    EYEBROW: 'Asignadas',
    TITLE: 'Actividades a mi cargo',
    DESCRIPTION: 'Avance planificado vs. real y costo registrado, listas para editar.',
  },
  PROJECT_STATUS: {
    EYEBROW: 'Contexto',
    TITLE: 'Estado del proyecto',
    DESCRIPTION: 'Semáforo consolidado en modo lectura.',
  },
} as const;

const ACTIVITY_SKELETONS = 3;

/** REGISTRAR home. Modules M8 and M11 fill these slots with the owner's activities. */
export function MyActivitiesPage() {
  const { user } = useAuth();
  const gridRef = useRef<HTMLDivElement>(null);
  useStaggerReveal(gridRef);

  return (
    <>
      <PageHeader
        eyebrow={COPY.EYEBROW}
        title={COPY.TITLE}
        description={user ? `${user.fullName} · ${COPY.DESCRIPTION}` : COPY.DESCRIPTION}
      />
      <div ref={gridRef} className="grid gap-6 lg:grid-cols-3">
        <PlaceholderCard
          {...{ [REVEAL_ATTRIBUTE]: true }}
          eyebrow={COPY.ASSIGNED.EYEBROW}
          title={COPY.ASSIGNED.TITLE}
          description={COPY.ASSIGNED.DESCRIPTION}
          className="lg:col-span-2"
        >
          <ul className="flex flex-col gap-3" aria-hidden="true">
            {Array.from({ length: ACTIVITY_SKELETONS }, (_, index) => (
              <li
                key={index}
                className="flex items-center justify-between gap-4 rounded-md bg-surface-sunken/60 p-4"
              >
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-8 w-20 rounded-pill" />
              </li>
            ))}
          </ul>
        </PlaceholderCard>
        <PlaceholderCard
          {...{ [REVEAL_ATTRIBUTE]: true }}
          eyebrow={COPY.PROJECT_STATUS.EYEBROW}
          title={COPY.PROJECT_STATUS.TITLE}
          description={COPY.PROJECT_STATUS.DESCRIPTION}
        >
          <SkeletonLines count={3} />
        </PlaceholderCard>
      </div>
    </>
  );
}
