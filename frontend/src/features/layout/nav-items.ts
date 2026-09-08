import { ROLES } from '@/api/types';
import { ROUTES } from '@/constants/routes';

import type { Role } from '@/api/types';

export interface NavItem {
  label: string;
  to: string;
  roles: readonly Role[];
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Portafolio', to: ROUTES.PROJECTS, roles: [ROLES.REVIEWER] },
  { label: 'Mis actividades', to: ROUTES.MY_ACTIVITIES, roles: [ROLES.REGISTRAR] },
];

export function navItemsForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export const HOME_ROUTE_BY_ROLE: Record<Role, string> = {
  [ROLES.REVIEWER]: ROUTES.PROJECTS,
  [ROLES.REGISTRAR]: ROUTES.MY_ACTIVITIES,
};
