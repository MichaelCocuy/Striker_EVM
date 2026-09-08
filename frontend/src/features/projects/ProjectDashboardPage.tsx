import { useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';

import { api } from '@/api/endpoints';
import { useApiQuery } from '@/api/useApiQuery';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import { ROUTE_PARAMS } from '@/constants/routes';
import { EVM_TONE, EVM_TONE_LABEL } from '@/evm/tone';
import { ActivitiesTablePlaceholder } from '@/features/activities/ActivitiesTablePlaceholder';
import { ChartPlaceholder } from '@/features/chart/ChartPlaceholder';
import { GaugePlaceholder } from '@/features/chart/GaugePlaceholder';
import { SummaryPlaceholder } from '@/features/summary/SummaryPlaceholder';
import { useStaggerReveal } from '@/motion/useStaggerReveal';

import type { EvmTone } from '@/evm/tone';

const COPY = {
  EYEBROW: 'Proyecto',
  LEGEND_LABEL: 'Semáforo EVM',
  NO_DESCRIPTION: 'Sin descripción.',
} as const;

const LEGEND_TONES: readonly EvmTone[] = [
  EVM_TONE.GOOD,
  EVM_TONE.NEUTRAL,
  EVM_TONE.BAD,
  EVM_TONE.NA,
];

/**
 * Project dashboard shell. Loads the project header and exposes three slots that
 * modules M9 (summary), M10 (chart) and M8 (activities table) fill in.
 */
export function ProjectDashboardPage() {
  const params = useParams();
  const projectId = params[ROUTE_PARAMS.PROJECT_ID] ?? '';
  const fetchProject = useCallback(() => api.getProject(projectId), [projectId]);
  const project = useApiQuery(fetchProject);

  const slotsRef = useRef<HTMLDivElement>(null);
  useStaggerReveal(slotsRef, { revealKey: projectId });

  return (
    <>
      <PageHeader
        eyebrow={COPY.EYEBROW}
        title={
          project.status === 'success' ? (
            project.data?.name
          ) : (
            <Skeleton className="h-10 w-72 max-w-full" />
          )
        }
        description={
          project.status === 'success' ? (
            (project.data?.description ?? COPY.NO_DESCRIPTION)
          ) : (
            <Skeleton className="h-4 w-96 max-w-full" />
          )
        }
        actions={
          <ul className="flex flex-wrap gap-2" aria-label={COPY.LEGEND_LABEL}>
            {LEGEND_TONES.map((tone) => (
              <li key={tone}>
                <StatusPill tone={tone} label={EVM_TONE_LABEL[tone]} />
              </li>
            ))}
          </ul>
        }
      />

      {project.status === 'error' && project.error && (
        <ErrorState message={project.error.message} onRetry={project.refetch} />
      )}

      <div ref={slotsRef} className="grid gap-6 lg:grid-cols-3">
        <SummaryPlaceholder />
        <ChartPlaceholder />
        <GaugePlaceholder />
        <ActivitiesTablePlaceholder />
      </div>
    </>
  );
}
