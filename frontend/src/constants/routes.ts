export const ROUTES = {
  ROOT: '/',
  LOGIN: '/login',
  PROJECTS: '/projects',
  PROJECT_DASHBOARD: '/projects/:projectId',
  MY_ACTIVITIES: '/my-activities',
} as const;

export const ROUTE_PARAMS = {
  PROJECT_ID: 'projectId',
} as const;

export function projectDashboardPath(projectId: string): string {
  return ROUTES.PROJECT_DASHBOARD.replace(`:${ROUTE_PARAMS.PROJECT_ID}`, projectId);
}
