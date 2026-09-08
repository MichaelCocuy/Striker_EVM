import { ROLES } from '@/api/types';

import type { Role } from '@/api/types';

export const ROLE_LABEL: Record<Role, string> = {
  [ROLES.REVIEWER]: 'Revisor',
  [ROLES.REGISTRAR]: 'Registrador',
};
