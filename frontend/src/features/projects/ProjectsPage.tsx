import { useCallback, useState } from 'react';

import { ErrorState } from '@/components/ui/ErrorState';
import { PERMISSIONS } from '@/features/auth/permissions';
import { useCan } from '@/features/auth/useCan';

import { EmptyPortfolio } from './EmptyPortfolio';
import { PORTFOLIO_COPY } from './portfolio-copy';
import { portfolioFigures } from './portfolio-figures';
import { toPortfolioItems } from './portfolio-items';
import { PORTFOLIO_LAYOUT } from './portfolio-layout';
import { PortfolioKpiStrip } from './PortfolioKpiStrip';
import { PortfolioQuadrant } from './PortfolioQuadrant';
import { PortfolioSkeleton } from './PortfolioSkeleton';
import { DIALOG_KIND } from './project-dialog-kind';
import { ProjectDialog } from './ProjectDialog';
import { ProjectList } from './ProjectList';
import { usePortfolio } from './usePortfolio';

import type { ProjectDialogState } from './project-dialog-kind';
import type { Project } from '@/api/types';

/**
 * REVIEWER home: the consolidated state of every project and which one needs attention, read
 * in three steps — the KPI strip, the cost-schedule quadrant and the dense list.
 *
 * The page never computes an EVM indicator: every figure comes from `GET /projects/{id}/evm`,
 * a `null` indicator prints `—` and is drawn by nothing. Create, edit and delete belong to the
 * reviewer; a REGISTRAR who reaches this page sees the same portfolio without them (and the
 * backend still answers 403 if they are attempted another way).
 */
export function ProjectsPage() {
  const can = useCan();
  const canManage = can(PERMISSIONS.PROJECT_CREATE);
  const portfolio = usePortfolio();
  const [dialog, setDialog] = useState<ProjectDialogState | null>(null);

  const entries = portfolio.data ?? [];
  const items = toPortfolioItems(entries);
  const figures = portfolioFigures(entries);

  const { refetch } = portfolio;
  const closeDialog = useCallback(() => {
    setDialog(null);
  }, []);
  const handleCompleted = useCallback(() => {
    setDialog(null);
    refetch();
  }, [refetch]);
  const openCreate = useCallback(() => {
    setDialog({ kind: DIALOG_KIND.CREATE });
  }, []);
  const openEdit = useCallback((project: Project) => {
    setDialog({ kind: DIALOG_KIND.EDIT, project });
  }, []);
  const openDelete = useCallback((project: Project) => {
    setDialog({ kind: DIALOG_KIND.DELETE, project });
  }, []);

  const isEmpty = portfolio.status === 'success' && items.length === 0;

  return (
    <>
      {/* The visible title of the view lives in the topbar; the outline still needs its h1. */}
      <h1 className="sr-only">{PORTFOLIO_COPY.PAGE_TITLE}</h1>

      {portfolio.status === 'error' && portfolio.error !== null && (
        <ErrorState message={portfolio.error.message} onRetry={refetch} />
      )}

      {portfolio.status === 'loading' && <PortfolioSkeleton />}

      {isEmpty && <EmptyPortfolio canManage={canManage} onCreate={openCreate} />}

      {items.length > 0 && (
        <>
          <PortfolioKpiStrip figures={figures} />
          <div className={PORTFOLIO_LAYOUT.COLUMNS}>
            <PortfolioQuadrant items={items} />
            <ProjectList
              items={items}
              canManage={canManage}
              onCreate={openCreate}
              onEdit={openEdit}
              onDelete={openDelete}
            />
          </div>
        </>
      )}

      {dialog !== null && (
        <ProjectDialog dialog={dialog} onClose={closeDialog} onCompleted={handleCompleted} />
      )}
    </>
  );
}
