import { useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';

import { api } from '@/api/endpoints';
import { useApiQuery } from '@/api/useApiQuery';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { ROUTE_PARAMS } from '@/constants/routes';
import { ActivitiesTable } from '@/features/activities/ActivitiesTable';
import { ActivityQuadrant } from '@/features/chart/ActivityQuadrant';
import { EvmChart } from '@/features/chart/EvmChart';
import { RiskHeatmap } from '@/features/chart/RiskHeatmap';
import { VarianceBridge } from '@/features/chart/VarianceBridge';
import { useEvmReport } from '@/features/evm-report/useEvmReport';
import { ProjectReadingBand } from '@/features/summary/ProjectReadingBand';
import { REVEAL_ATTRIBUTE } from '@/motion/constants';
import { useStaggerReveal } from '@/motion/useStaggerReveal';

const COPY = {
  EYEBROW: 'Proyecto',
  NO_DESCRIPTION: 'Sin descripción.',
} as const;

/**
 * UI flags of the dashboard (handoff, State Management). They exist as tweakable props in
 * the prototype and default to `true` in production, which is what the handoff settles on
 * while there is no user preference to persist them in.
 */
const FLAG_DEFAULT = { SHOW_RISK_HEATMAP: true } as const;

/** 18px between bands and 16px inside the chart grid, the two gaps of the design system. */
const LAYOUT = {
  PAGE: 'flex flex-col gap-[18px]',
  CHARTS: 'grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] items-start gap-4',
} as const;

const SKELETON = { TITLE_CLASS: 'h-10 w-72 max-w-full', DESCRIPTION_CLASS: 'h-4 w-96 max-w-full' };

export interface ProjectDashboardPageProps {
  /** Whether the risk heat map is drawn (handoff §3.6); `true` unless a caller says not. */
  showRiskHeatmap?: boolean;
}

/**
 * Project dashboard, read from conclusion to detail exactly in the order the handoff sets
 * out (§3): the navy reading band, then the variance bridge, the per-activity bars, the
 * quadrant and the risk heat map, and last the activities table.
 *
 * The cumulative S-curve of §3.2 is deliberately absent: it needs a per-cut-off history the
 * data model does not have, and the handoff itself says a synthetic curve is worse than no
 * curve. Its strip of four base figures lives under the bridge instead, so PV, EV, AC and
 * BAC are still on the page.
 *
 * It owns the single EVM report request and hands the same data to every visualization; a
 * mutation reports back through `onDataChanged`, the report is refetched and all of them
 * update at once.
 */
export function ProjectDashboardPage({
  showRiskHeatmap = FLAG_DEFAULT.SHOW_RISK_HEATMAP,
}: ProjectDashboardPageProps = {}) {
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
  /**
   * A project with no activities says so in the band and draws nothing else: the report
   * arrives with money at zero and both traffic lights off, and zeros would be a lie.
   */
  const hasVisualizations = isReportLoading || activities.length > 0;

  return (
    <>
      <PageHeader
        eyebrow={COPY.EYEBROW}
        title={
          project.status === 'success' ? (
            project.data?.name
          ) : (
            <Skeleton className={SKELETON.TITLE_CLASS} />
          )
        }
        description={
          project.status === 'success' ? (
            (project.data?.description ?? COPY.NO_DESCRIPTION)
          ) : (
            <Skeleton className={SKELETON.DESCRIPTION_CLASS} />
          )
        }
      />

      {project.status === 'error' && project.error && (
        <ErrorState message={project.error.message} onRetry={project.refetch} />
      )}
      {report.status === 'error' && report.error && (
        <ErrorState message={report.error.message} onRetry={report.refetch} />
      )}

      <div ref={slotsRef} className={LAYOUT.PAGE}>
        <ProjectReadingBand
          {...{ [REVEAL_ATTRIBUTE]: true }}
          indicators={projectIndicators}
          activities={activities}
        />
        {hasVisualizations && (
          <div className={LAYOUT.CHARTS}>
            <VarianceBridge
              {...{ [REVEAL_ATTRIBUTE]: true }}
              indicators={projectIndicators}
              isLoading={isReportLoading}
            />
            <EvmChart
              {...{ [REVEAL_ATTRIBUTE]: true }}
              activities={activities}
              isLoading={isReportLoading}
            />
            <ActivityQuadrant
              {...{ [REVEAL_ATTRIBUTE]: true }}
              activities={activities}
              isLoading={isReportLoading}
            />
            {showRiskHeatmap && (
              <RiskHeatmap
                {...{ [REVEAL_ATTRIBUTE]: true }}
                activities={activities}
                indicators={projectIndicators}
                isLoading={isReportLoading}
              />
            )}
          </div>
        )}
        <ActivitiesTable
          {...{ [REVEAL_ATTRIBUTE]: true }}
          projectId={projectId}
          activities={activities}
          isLoading={isReportLoading}
          onDataChanged={handleDataChanged}
        />
      </div>
    </>
  );
}
