import { useRef } from 'react';

import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton, SkeletonLines } from '@/components/ui/Skeleton';
import { PERMISSIONS } from '@/features/auth/permissions';
import { useCan } from '@/features/auth/useCan';
import { useStaggerReveal } from '@/motion/useStaggerReveal';

import { ProjectCard } from './ProjectCard';
import { usePortfolio } from './usePortfolio';

const COPY = {
  EYEBROW: 'Portafolio',
  TITLE: 'Proyectos',
  DESCRIPTION:
    'Estado consolidado de cada proyecto: costo y cronograma tal como los reporta el cálculo EVM del backend.',
  LOADING: 'Cargando el portafolio…',
  EMPTY: {
    EYEBROW: 'Portafolio vacío',
    TITLE: 'Todavía no hay proyectos',
    REVIEWER_BODY: 'Crea el primer proyecto para registrar sus actividades y seguir su estado EVM.',
    READ_ONLY_BODY: 'Cuando un revisor cree un proyecto, aparecerá aquí con su estado.',
  },
} as const;

const PORTFOLIO_SKELETONS = 3;
const SKELETON_DESCRIPTION_LINES = 2;
const GRID_CLASSES = 'grid gap-6 md:grid-cols-2 xl:grid-cols-3';

function PortfolioSkeleton() {
  return (
    <>
      <p role="status" className="sr-only">
        {COPY.LOADING}
      </p>
      <div className={GRID_CLASSES} aria-hidden="true">
        {Array.from({ length: PORTFOLIO_SKELETONS }, (_, index) => (
          <div key={index} className="card flex flex-col gap-4 p-6">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-3/4" />
            <SkeletonLines count={SKELETON_DESCRIPTION_LINES} />
            <Skeleton className="h-8 w-44 rounded-pill" />
          </div>
        ))}
      </div>
    </>
  );
}

/**
 * REVIEWER home: every project with the consolidated traffic light of its EVM report.
 * A REGISTRAR who reaches this page sees the same portfolio in read-only mode.
 */
export function ProjectsPage() {
  const can = useCan();
  const canManage = can(PERMISSIONS.PROJECT_CREATE);
  const portfolio = usePortfolio();

  const gridRef = useRef<HTMLDivElement>(null);
  const entries = portfolio.data ?? [];
  useStaggerReveal(gridRef, { revealKey: entries.length });

  const isEmpty = portfolio.status === 'success' && entries.length === 0;

  return (
    <>
      <PageHeader eyebrow={COPY.EYEBROW} title={COPY.TITLE} description={COPY.DESCRIPTION} />

      {portfolio.status === 'error' && portfolio.error !== null && (
        <ErrorState message={portfolio.error.message} onRetry={portfolio.refetch} />
      )}

      {portfolio.status === 'loading' && <PortfolioSkeleton />}

      {isEmpty && (
        <Card
          eyebrow={COPY.EMPTY.EYEBROW}
          title={COPY.EMPTY.TITLE}
          description={canManage ? COPY.EMPTY.REVIEWER_BODY : COPY.EMPTY.READ_ONLY_BODY}
        />
      )}

      {entries.length > 0 && (
        <div ref={gridRef} className={GRID_CLASSES}>
          {entries.map((entry) => (
            <ProjectCard key={entry.project.id} entry={entry} />
          ))}
        </div>
      )}
    </>
  );
}
