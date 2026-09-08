import { useState } from 'react';

import { api } from '@/api/endpoints';
import { isApiError } from '@/api/errors';
import { Button } from '@/components/ui/Button';
import { BUTTON_VARIANT } from '@/components/ui/button-variants';
import { ErrorState } from '@/components/ui/ErrorState';

import type { Project } from '@/api/types';

const COPY = {
  ERROR_TITLE: 'No pudimos eliminar el proyecto',
  UNEXPECTED: 'No pudimos eliminar el proyecto. Intenta de nuevo.',
  CASCADE_WARNING:
    'Al eliminar el proyecto se eliminan también sus actividades y su histórico. Esta acción no se puede deshacer.',
  ACTIVITIES_LABEL: 'Actividades que se eliminarán',
  CANCEL: 'Cancelar',
  CONFIRM: 'Eliminar proyecto',
} as const;

interface DeleteProjectConfirmProps {
  project: Project;
  onDeleted: () => void;
  onCancel: () => void;
}

/** Deliberate confirmation step: the portfolio never deletes on a single click. */
export function DeleteProjectConfirm({ project, onDeleted, onCancel }: DeleteProjectConfirmProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete(): Promise<void> {
    setIsDeleting(true);
    setError(null);
    try {
      await api.deleteProject(project.id);
    } catch (deleteError) {
      setError(isApiError(deleteError) ? deleteError.message : COPY.UNEXPECTED);
      setIsDeleting(false);
      return;
    }
    onDeleted();
  }

  return (
    <div className="flex flex-col gap-5">
      {error !== null && <ErrorState title={COPY.ERROR_TITLE} message={error} />}
      <div className="flex flex-col gap-2 rounded-md border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
        <p className="font-semibold">{project.name}</p>
        <p>{COPY.CASCADE_WARNING}</p>
        <p className="numeric font-semibold">{`${COPY.ACTIVITIES_LABEL}: ${project.activityCount}`}</p>
      </div>
      <footer className="flex flex-wrap justify-end gap-3">
        <Button variant={BUTTON_VARIANT.SECONDARY} onClick={onCancel} disabled={isDeleting}>
          {COPY.CANCEL}
        </Button>
        <Button variant={BUTTON_VARIANT.DANGER} loading={isDeleting} onClick={handleDelete}>
          {COPY.CONFIRM}
        </Button>
      </footer>
    </div>
  );
}
