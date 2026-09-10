import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { ArrowLeft, ICON_SIZE, ICON_STROKE } from '@/components/ui/icons';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonLines } from '@/components/ui/Skeleton';
import { projectDashboardPath, ROUTE_PARAMS } from '@/constants/routes';
import { useEvmReport } from '@/features/evm-report/useEvmReport';
import { formatMoney } from '@/lib/format';
import { REVEAL_ATTRIBUTE } from '@/motion/constants';
import { useStaggerReveal } from '@/motion/useStaggerReveal';

import { ACTIVITY_DETAIL_COPY } from './activity-detail';
import { ActivityDeleteDialog } from './ActivityDeleteDialog';
import { ActivityFormDialog } from './ActivityFormDialog';
import { ActivityIndicatorsCard } from './ActivityIndicatorsCard';
import { ActivityProgressPanel } from './ActivityProgressPanel';
import { ActivityReadingCard } from './ActivityReadingCard';

const GRID_CLASS = 'grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-4';
const SKELETON_LINES = 5;

/** Which of the three flows of the detail is open; only one can be at a time. */
const FLOW = {
  REGISTER: 'register',
  EDIT: 'edit',
  DELETE: 'delete',
} as const;

type OpenFlow = (typeof FLOW)[keyof typeof FLOW];

/**
 * Activity detail (`/projects/:projectId/activities/:activityId`): what one activity is worth,
 * what it cost and where it lands, without going to another screen for a figure.
 *
 * It resolves the activity from the project's EVM report — the same single request the
 * dashboard makes — so no indicator is recalculated and no extra endpoint is needed.
 */
export function ActivityDetailPage() {
  const params = useParams();
  const projectId = params[ROUTE_PARAMS.PROJECT_ID] ?? '';
  const activityId = params[ROUTE_PARAMS.ACTIVITY_ID] ?? '';
  const navigate = useNavigate();
  const report = useEvmReport(projectId);
  const [openFlow, setOpenFlow] = useState<OpenFlow | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  useStaggerReveal(gridRef, { revealKey: activityId });

  const activity = report.data?.activities.find((candidate) => candidate.id === activityId) ?? null;
  const projectName = report.data?.project.name ?? '';
  const isLoading = report.status === 'loading';

  function closeFlow() {
    setOpenFlow(null);
  }

  function handleSaved() {
    setOpenFlow(null);
    report.refetch();
  }

  function handleDeleted() {
    setOpenFlow(null);
    void navigate(projectDashboardPath(projectId));
  }

  return (
    <>
      <Link
        to={projectDashboardPath(projectId)}
        className="inline-flex items-center gap-2 self-start font-heading text-caption font-semibold text-accent"
      >
        <ArrowLeft aria-hidden="true" size={ICON_SIZE.COMPACT} strokeWidth={ICON_STROKE.ALERT} />
        {ACTIVITY_DETAIL_COPY.BACK}
      </Link>

      {report.status === 'error' && report.error && (
        <ErrorState message={report.error.message} onRetry={report.refetch} />
      )}

      {activity !== null && (
        <PageHeader
          eyebrow={`${ACTIVITY_DETAIL_COPY.EYEBROW}${ACTIVITY_DETAIL_COPY.SEPARATOR}${projectName}`}
          title={activity.name}
          description={`${ACTIVITY_DETAIL_COPY.OWNER} ${activity.owner.fullName}${ACTIVITY_DETAIL_COPY.SEPARATOR}${ACTIVITY_DETAIL_COPY.BUDGET_LABEL} ${formatMoney(activity.indicators.budgetAtCompletion)}`}
        />
      )}

      {isLoading ? (
        <div className={GRID_CLASS}>
          <Card>
            <SkeletonLines count={SKELETON_LINES} />
          </Card>
          <Card>
            <SkeletonLines count={SKELETON_LINES} />
          </Card>
        </div>
      ) : activity === null ? (
        report.status === 'success' && (
          <Card>
            <p className="text-small text-ink-muted">{ACTIVITY_DETAIL_COPY.MISSING}</p>
          </Card>
        )
      ) : (
        <div ref={gridRef} className={GRID_CLASS}>
          <ActivityReadingCard
            {...{ [REVEAL_ATTRIBUTE]: true }}
            activity={activity}
            onRegister={() => setOpenFlow(FLOW.REGISTER)}
            onEdit={() => setOpenFlow(FLOW.EDIT)}
            onDelete={() => setOpenFlow(FLOW.DELETE)}
          />
          <ActivityIndicatorsCard
            {...{ [REVEAL_ATTRIBUTE]: true }}
            indicators={activity.indicators}
          />
        </div>
      )}

      {activity !== null && openFlow === FLOW.REGISTER && (
        <ActivityProgressPanel
          projectId={projectId}
          projectName={projectName}
          activity={activity}
          onClose={closeFlow}
          onSaved={handleSaved}
        />
      )}
      {activity !== null && openFlow === FLOW.EDIT && (
        <ActivityFormDialog
          projectId={projectId}
          activity={activity}
          onClose={closeFlow}
          onSaved={handleSaved}
        />
      )}
      {activity !== null && openFlow === FLOW.DELETE && (
        <ActivityDeleteDialog
          projectId={projectId}
          activity={activity}
          onClose={closeFlow}
          onDeleted={handleDeleted}
        />
      )}
    </>
  );
}
