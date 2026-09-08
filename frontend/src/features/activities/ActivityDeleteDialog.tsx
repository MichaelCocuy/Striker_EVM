import { api } from '@/api/endpoints';
import { Button } from '@/components/ui/Button';
import { BUTTON_VARIANT } from '@/components/ui/button-variants';
import { ModalDialog } from '@/components/ui/ModalDialog';

import { useActivityMutation } from './useActivityMutation';

import type { EvmActivityReport } from '@/api/types';

const COPY = {
  TITLE: 'Eliminar actividad',
  DESCRIPTION: 'Esta acción no se puede deshacer y el reporte EVM se recalcula sin la actividad.',
  QUESTION: '¿Confirmas eliminar la actividad',
  CONFIRM: 'Eliminar',
  CANCEL: 'Cancelar',
} as const;

interface ActivityDeleteDialogProps {
  projectId: string;
  activity: EvmActivityReport;
  onClose: () => void;
  /** Called after the API confirmed the deletion. */
  onDeleted: () => void;
}

/** Explicit confirmation step before `DELETE /projects/{id}/activities/{id}`. */
export function ActivityDeleteDialog({
  projectId,
  activity,
  onClose,
  onDeleted,
}: ActivityDeleteDialogProps) {
  const mutation = useActivityMutation();

  async function handleConfirm() {
    await mutation.run(() => api.deleteActivity(projectId, activity.id), onDeleted);
  }

  return (
    <ModalDialog title={COPY.TITLE} description={COPY.DESCRIPTION} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-base text-ink">
          {`${COPY.QUESTION} `}
          <strong className="font-semibold">{activity.name}</strong>
          {'?'}
        </p>
        {mutation.error !== null && (
          <p role="alert" className="rounded-md bg-danger-soft p-3 text-sm text-danger">
            {mutation.error.message}
          </p>
        )}
        <footer className="flex flex-wrap justify-end gap-3">
          <Button variant={BUTTON_VARIANT.SECONDARY} onClick={onClose}>
            {COPY.CANCEL}
          </Button>
          <Button
            variant={BUTTON_VARIANT.DANGER}
            loading={mutation.isPending}
            onClick={handleConfirm}
          >
            {COPY.CONFIRM}
          </Button>
        </footer>
      </div>
    </ModalDialog>
  );
}
