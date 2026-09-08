import { useCallback, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton, SkeletonLines } from '@/components/ui/Skeleton';
import { PERMISSIONS } from '@/features/auth/permissions';
import { useCan } from '@/features/auth/useCan';
import { useStaggerReveal } from '@/motion/useStaggerReveal';

import { DeleteProjectConfirm } from './DeleteProjectConfirm';
import { ProjectCard } from './ProjectCard';
import { ProjectDialog } from './ProjectDialog';
import { ProjectForm } from './ProjectForm';
import { usePortfolio } from './usePortfolio';

import type { Project } from '@/api/types';

const COPY = {
  EYEBROW: 'Portafolio',
  TITLE: 'Proyectos',
  DESCRIPTION:
    'Estado consolidado de cada proyecto: costo y cronograma tal como los reporta el cálculo EVM del backend.',
  NEW_PROJECT: 'Nuevo proyecto',
  LOADING: 'Cargando el portafolio…',
  EMPTY: {
    EYEBROW: 'Portafolio vacío',
    TITLE: 'Todavía no hay proyectos',
    REVIEWER_BODY: 'Crea el primer proyecto para registrar sus actividades y seguir su estado EVM.',
    READ_ONLY_BODY: 'Cuando un revisor cree un proyecto, aparecerá aquí con su estado.',
  },
  DIALOG: {
    CREATE_TITLE: 'Nuevo proyecto',
    CREATE_DESCRIPTION: 'Registra el proyecto; después podrás agregarle actividades.',
    EDIT_TITLE: 'Editar proyecto',
    EDIT_DESCRIPTION: 'Actualiza el nombre o la descripción del proyecto.',
    DELETE_TITLE: 'Eliminar proyecto',
    DELETE_DESCRIPTION: 'Confirma la eliminación; es definitiva.',
  },
} as const;

const PORTFOLIO_SKELETONS = 3;
const SKELETON_DESCRIPTION_LINES = 2;
const GRID_CLASSES = 'grid gap-6 md:grid-cols-2 xl:grid-cols-3';

const DIALOG_KIND = {
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
} as const;

type DialogState =
  | { kind: typeof DIALOG_KIND.CREATE }
  | { kind: typeof DIALOG_KIND.EDIT; project: Project }
  | { kind: typeof DIALOG_KIND.DELETE; project: Project };

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

interface EmptyPortfolioProps {
  canManage: boolean;
  onCreate: () => void;
}

function EmptyPortfolio({ canManage, onCreate }: EmptyPortfolioProps) {
  return (
    <Card
      eyebrow={COPY.EMPTY.EYEBROW}
      title={COPY.EMPTY.TITLE}
      description={canManage ? COPY.EMPTY.REVIEWER_BODY : COPY.EMPTY.READ_ONLY_BODY}
    >
      {canManage && (
        <div>
          <Button onClick={onCreate}>{COPY.NEW_PROJECT}</Button>
        </div>
      )}
    </Card>
  );
}

interface PortfolioDialogProps {
  dialog: DialogState;
  onClose: () => void;
  /** Called after a successful create, edit or delete. */
  onCompleted: () => void;
}

function PortfolioDialog({ dialog, onClose, onCompleted }: PortfolioDialogProps) {
  switch (dialog.kind) {
    case DIALOG_KIND.CREATE:
      return (
        <ProjectDialog
          title={COPY.DIALOG.CREATE_TITLE}
          description={COPY.DIALOG.CREATE_DESCRIPTION}
          onClose={onClose}
        >
          <ProjectForm project={null} onSaved={onCompleted} onCancel={onClose} />
        </ProjectDialog>
      );
    case DIALOG_KIND.EDIT:
      return (
        <ProjectDialog
          title={COPY.DIALOG.EDIT_TITLE}
          description={COPY.DIALOG.EDIT_DESCRIPTION}
          onClose={onClose}
        >
          <ProjectForm project={dialog.project} onSaved={onCompleted} onCancel={onClose} />
        </ProjectDialog>
      );
    case DIALOG_KIND.DELETE:
      return (
        <ProjectDialog
          title={COPY.DIALOG.DELETE_TITLE}
          description={COPY.DIALOG.DELETE_DESCRIPTION}
          onClose={onClose}
        >
          <DeleteProjectConfirm
            project={dialog.project}
            onDeleted={onCompleted}
            onCancel={onClose}
          />
        </ProjectDialog>
      );
  }
}

/**
 * REVIEWER home: every project with its consolidated traffic light, plus the create, edit and
 * delete flows. A REGISTRAR who reaches this page sees the same portfolio without the actions
 * (the backend still answers 403 if they are attempted another way).
 */
export function ProjectsPage() {
  const can = useCan();
  const canManage = can(PERMISSIONS.PROJECT_CREATE);
  const portfolio = usePortfolio();
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const entries = portfolio.data ?? [];
  useStaggerReveal(gridRef, { revealKey: entries.length });

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

  const isEmpty = portfolio.status === 'success' && entries.length === 0;

  return (
    <>
      <PageHeader
        eyebrow={COPY.EYEBROW}
        title={COPY.TITLE}
        description={COPY.DESCRIPTION}
        actions={canManage && <Button onClick={openCreate}>{COPY.NEW_PROJECT}</Button>}
      />

      {portfolio.status === 'error' && portfolio.error !== null && (
        <ErrorState message={portfolio.error.message} onRetry={refetch} />
      )}

      {portfolio.status === 'loading' && <PortfolioSkeleton />}

      {isEmpty && <EmptyPortfolio canManage={canManage} onCreate={openCreate} />}

      {entries.length > 0 && (
        <div ref={gridRef} className={GRID_CLASSES}>
          {entries.map((entry) => (
            <ProjectCard
              key={entry.project.id}
              entry={entry}
              canManage={canManage}
              onEdit={openEdit}
              onDelete={openDelete}
            />
          ))}
        </div>
      )}

      {dialog !== null && (
        <PortfolioDialog dialog={dialog} onClose={closeDialog} onCompleted={handleCompleted} />
      )}
    </>
  );
}
