import { matchPath } from 'react-router-dom';

import { ROUTES } from '@/constants/routes';

/** What the topbar says about where the reader is: the crumb above, the place below. */
export interface PageLocation {
  crumb: string;
  title: string;
}

const PORTFOLIO_CRUMB = 'Portafolio';

/**
 * One entry per route of `constants/routes.ts`, most specific first.
 *
 * The dashboard's crumb stops at «Portafolio» rather than naming the project: the topbar is
 * outside the view that owns the report request, and the handoff keeps that request single.
 * The activity detail says «Actividad» for the same reason — the name of the activity lives in
 * the page header, which is inside the view that already has the report.
 */
const LOCATIONS: readonly { pattern: string; location: PageLocation }[] = [
  { pattern: ROUTES.PROJECTS, location: { crumb: PORTFOLIO_CRUMB, title: 'Todos los proyectos' } },
  {
    pattern: ROUTES.ACTIVITY_DETAIL,
    location: { crumb: PORTFOLIO_CRUMB, title: 'Actividad' },
  },
  {
    pattern: ROUTES.PROJECT_DASHBOARD,
    location: { crumb: PORTFOLIO_CRUMB, title: 'Tablero del proyecto' },
  },
  {
    pattern: ROUTES.MY_ACTIVITIES,
    location: { crumb: 'Mi trabajo', title: 'Mis actividades' },
  },
];

const FALLBACK_LOCATION: PageLocation = { crumb: 'Striker EVM', title: 'Valor ganado' };

export function pageLocationFor(pathname: string): PageLocation {
  const match = LOCATIONS.find((entry) => matchPath(entry.pattern, pathname) !== null);
  return match?.location ?? FALLBACK_LOCATION;
}
