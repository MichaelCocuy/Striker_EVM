import type { Project } from '@/api/types';

/** Which management flow the portfolio has open, and on which project. */
export const DIALOG_KIND = {
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
} as const;

export type ProjectDialogState =
  | { kind: typeof DIALOG_KIND.CREATE }
  | { kind: typeof DIALOG_KIND.EDIT; project: Project }
  | { kind: typeof DIALOG_KIND.DELETE; project: Project };
