import { useRef } from 'react';

import { PageHeader } from '@/components/ui/PageHeader';
import { PlaceholderCard } from '@/components/ui/PlaceholderCard';
import { Skeleton, SkeletonLines } from '@/components/ui/Skeleton';
import { REVEAL_ATTRIBUTE } from '@/motion/constants';
import { useStaggerReveal } from '@/motion/useStaggerReveal';

const COPY = {
  EYEBROW: 'Portafolio',
  TITLE: 'Proyectos',
  DESCRIPTION:
    'Estado consolidado de cada proyecto: costo, cronograma y pronóstico al cierre a partir de las actividades registradas.',
  PROJECT_LIST: {
    EYEBROW: 'Listado',
    TITLE: 'Proyectos activos',
    DESCRIPTION: 'Cada tarjeta mostrará nombre, actividades y su semáforo consolidado.',
  },
  CREATE: {
    EYEBROW: 'Gestión',
    TITLE: 'Nuevo proyecto',
    DESCRIPTION: 'Alta de proyectos y asignación de responsables (solo revisores).',
  },
  HEALTH: {
    EYEBROW: 'Resumen',
    TITLE: 'Salud del portafolio',
    DESCRIPTION: 'Proyectos bajo, en y sobre presupuesto de un vistazo.',
  },
} as const;

const PROJECT_CARD_SKELETONS = 3;
const KPI_SKELETONS = 3;

/** REVIEWER home. Module M11 replaces the placeholders with the real project list. */
export function ProjectsPage() {
  const gridRef = useRef<HTMLDivElement>(null);
  useStaggerReveal(gridRef);

  return (
    <>
      <PageHeader eyebrow={COPY.EYEBROW} title={COPY.TITLE} description={COPY.DESCRIPTION} />
      <div ref={gridRef} className="grid gap-6 lg:grid-cols-3">
        <PlaceholderCard
          {...{ [REVEAL_ATTRIBUTE]: true }}
          eyebrow={COPY.PROJECT_LIST.EYEBROW}
          title={COPY.PROJECT_LIST.TITLE}
          description={COPY.PROJECT_LIST.DESCRIPTION}
          className="lg:col-span-2"
        >
          <ul className="grid gap-4 sm:grid-cols-3" aria-hidden="true">
            {Array.from({ length: PROJECT_CARD_SKELETONS }, (_, index) => (
              <li key={index} className="flex flex-col gap-3 rounded-md bg-surface-sunken/60 p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="mt-2 h-8 w-24 rounded-pill" />
              </li>
            ))}
          </ul>
        </PlaceholderCard>
        <PlaceholderCard
          {...{ [REVEAL_ATTRIBUTE]: true }}
          eyebrow={COPY.HEALTH.EYEBROW}
          title={COPY.HEALTH.TITLE}
          description={COPY.HEALTH.DESCRIPTION}
        >
          <div className="grid grid-cols-3 gap-3" aria-hidden="true">
            {Array.from({ length: KPI_SKELETONS }, (_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-md" />
            ))}
          </div>
        </PlaceholderCard>
        <PlaceholderCard
          {...{ [REVEAL_ATTRIBUTE]: true }}
          eyebrow={COPY.CREATE.EYEBROW}
          title={COPY.CREATE.TITLE}
          description={COPY.CREATE.DESCRIPTION}
          className="lg:col-span-3"
        >
          <SkeletonLines count={2} />
        </PlaceholderCard>
      </div>
    </>
  );
}
