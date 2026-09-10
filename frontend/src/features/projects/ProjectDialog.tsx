import { ModalDialog } from '@/components/ui/ModalDialog';

import { DeleteProjectConfirm } from './DeleteProjectConfirm';
import { PORTFOLIO_COPY } from './portfolio-copy';
import { DIALOG_KIND } from './project-dialog-kind';
import { ProjectForm } from './ProjectForm';

import type { ProjectDialogState } from './project-dialog-kind';

/**
 * The reviewer's three management flows in one modal shell. Deleting always goes through the
 * confirmation step: the portfolio never destroys anything on a single click, and never with
 * a browser `confirm`.
 */

interface ProjectDialogProps {
  dialog: ProjectDialogState;
  onClose: () => void;
  /** Called after a successful create, edit or delete. */
  onCompleted: () => void;
}

export function ProjectDialog({ dialog, onClose, onCompleted }: ProjectDialogProps) {
  const { DIALOG } = PORTFOLIO_COPY;

  switch (dialog.kind) {
    case DIALOG_KIND.CREATE:
      return (
        <ModalDialog
          title={DIALOG.CREATE_TITLE}
          description={DIALOG.CREATE_DESCRIPTION}
          onClose={onClose}
        >
          <ProjectForm project={null} onSaved={onCompleted} onCancel={onClose} />
        </ModalDialog>
      );
    case DIALOG_KIND.EDIT:
      return (
        <ModalDialog
          title={DIALOG.EDIT_TITLE}
          description={DIALOG.EDIT_DESCRIPTION}
          onClose={onClose}
        >
          <ProjectForm project={dialog.project} onSaved={onCompleted} onCancel={onClose} />
        </ModalDialog>
      );
    case DIALOG_KIND.DELETE:
      return (
        <ModalDialog
          title={DIALOG.DELETE_TITLE}
          description={DIALOG.DELETE_DESCRIPTION}
          onClose={onClose}
        >
          <DeleteProjectConfirm
            project={dialog.project}
            onDeleted={onCompleted}
            onCancel={onClose}
          />
        </ModalDialog>
      );
  }
}
