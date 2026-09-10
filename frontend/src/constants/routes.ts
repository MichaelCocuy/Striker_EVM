export const ROUTES = {
  ROOT: '/',
  LOGIN: '/login',
  PROJECTS: '/projects',
  PROJECT_DASHBOARD: '/projects/:projectId',
  /** Detail of one activity of the project; destination of a click on a table row. */
  ACTIVITY_DETAIL: '/projects/:projectId/activities/:activityId',
  MY_ACTIVITIES: '/my-activities',
} as const;

export const ROUTE_PARAMS = {
  PROJECT_ID: 'projectId',
  ACTIVITY_ID: 'activityId',
} as const;

export function projectDashboardPath(projectId: string): string {
  return ROUTES.PROJECT_DASHBOARD.replace(`:${ROUTE_PARAMS.PROJECT_ID}`, projectId);
}

export function activityDetailPath(projectId: string, activityId: string): string {
  return ROUTES.ACTIVITY_DETAIL.replace(`:${ROUTE_PARAMS.PROJECT_ID}`, projectId).replace(
    `:${ROUTE_PARAMS.ACTIVITY_ID}`,
    activityId,
  );
}
