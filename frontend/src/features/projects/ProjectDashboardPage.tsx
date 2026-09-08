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
import { ActivitiesTable } from '@/features/activities/ActivitiesTable';
import { EvmChart } from '@/features/chart/EvmChart';
import { useEvmReport } from '@/features/evm-report/useEvmReport';
import { ProjectSummary } from '@/features/summary/ProjectSummary';
import { REVEAL_ATTRIBUTE } from '@/motion/constants';
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
 * Project dashboard. It owns the single EVM report request and hands the same data to the
 * summary (M9), the chart (M10) and the activities table (M8); every mutation reports back
 * through `onDataChanged` so the report is refetched and all three update at once.
 */
export function ProjectDashboardPage() {
  const params = useParams();
  const projectId = params[ROUTE_PARAMS.PROJECT_ID] ?? '';
  const fetchProject = useCallback(() => api.getProject(projectId), [projectId]);
  const project = useApiQuery(fetchProject);
  const report = useEvmReport(projectId);

  const slotsRef = useRef<HTMLDivElement>(null);
  useStaggerReveal(slotsRef, { revealKey: projectId });

  const handleDataChanged = useCallback(() => {
    report.refetch();
    project.refetch();
  }, [project, report]);

  const isReportLoading = report.status === 'loading';
  const activities = report.data?.activities ?? [];
  const projectIndicators = report.data?.project.indicators ?? null;

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
      {report.status === 'error' && report.error && (
        <ErrorState message={report.error.message} onRetry={report.refetch} />
      )}

      <div ref={slotsRef} className="grid gap-6 lg:grid-cols-3">
        <ProjectSummary
          {...{ [REVEAL_ATTRIBUTE]: true }}
          indicators={projectIndicators}
          className="lg:col-span-2"
        />
        <EvmChart
          {...{ [REVEAL_ATTRIBUTE]: true }}
          activities={activities}
          indicators={projectIndicators}
          isLoading={isReportLoading}
        />
        <ActivitiesTable
          {...{ [REVEAL_ATTRIBUTE]: true }}
          projectId={projectId}
          activities={activities}
          isLoading={isReportLoading}
          onDataChanged={handleDataChanged}
          className="lg:col-span-3"
        />
      </div>
    </>
  );
}
