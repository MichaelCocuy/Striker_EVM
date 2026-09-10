import { ROLES } from '@/api/types';

import { ROLE_LABEL } from './role-labels';

import type { Role } from '@/api/types';

const ROLE_CLASSES: Record<Role, string> = {
  [ROLES.REVIEWER]: 'bg-accent-soft text-accent',
  [ROLES.REGISTRAR]: 'bg-evm-good-soft text-evm-good',
};

interface RoleBadgeProps {
  role: Role;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2 py-0.5 font-heading text-badge font-bold tracking-wide uppercase ${ROLE_CLASSES[role]}`}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}
