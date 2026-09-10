import { ROLES } from '@/api/types';
import { BarChart2, FileText, LayoutDashboard } from '@/components/ui/icons';
import { projectDashboardPath, ROUTES } from '@/constants/routes';

import type { Role } from '@/api/types';
import type { LucideIcon } from '@/components/ui/icons';

export interface NavItem {
  label: string;
  to: string;
  roles: readonly Role[];
  icon: LucideIcon;
}

/** A titled block of the sidebar; the handoff groups the nav in two. */
export interface NavGroup {
  title: string;
  items: readonly NavItem[];
}

const NAV_GROUP_TITLE = {
  TRACKING: 'Seguimiento',
  MY_WORK: 'Mi trabajo',
} as const;

const PORTFOLIO_ITEM: NavItem = {
  label: 'Portafolio',
  to: ROUTES.PROJECTS,
  roles: [ROLES.REVIEWER],
  icon: LayoutDashboard,
};

const MY_ACTIVITIES_ITEM: NavItem = {
  label: 'Mis actividades',
  to: ROUTES.MY_ACTIVITIES,
  roles: [ROLES.REGISTRAR],
  icon: FileText,
};

const PROJECT_DASHBOARD_LABEL = 'Tablero del proyecto';

/**
 * The dashboard of a project is reachable by both roles, but it needs a project to point at,
 * so it joins the group only while one is open. That keeps the sidebar free of dead links
 * without asking it to guess a project id.
 */
function projectDashboardItems(projectId: string | null): NavItem[] {
  if (projectId === null) {
    return [];
  }
  return [
    {
      label: PROJECT_DASHBOARD_LABEL,
      to: projectDashboardPath(projectId),
      roles: [ROLES.REVIEWER, ROLES.REGISTRAR],
      icon: BarChart2,
    },
  ];
}

/** The groups this role may see, in the handoff's order, with empty groups dropped. */
export function navGroupsForRole(role: Role, projectId: string | null): NavGroup[] {
  const groups: NavGroup[] = [
    {
      title: NAV_GROUP_TITLE.TRACKING,
      items: [PORTFOLIO_ITEM, ...projectDashboardItems(projectId)],
    },
    { title: NAV_GROUP_TITLE.MY_WORK, items: [MY_ACTIVITIES_ITEM] },
  ];

  return groups
    .map((group) => ({ ...group, items: group.items.filter((item) => item.roles.includes(role)) }))
    .filter((group) => group.items.length > 0);
}

export const HOME_ROUTE_BY_ROLE: Record<Role, string> = {
  [ROLES.REVIEWER]: ROUTES.PROJECTS,
  [ROLES.REGISTRAR]: ROUTES.MY_ACTIVITIES,
};
