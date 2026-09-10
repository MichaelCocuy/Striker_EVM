import { createBrowserRouter } from 'react-router-dom';

import { ROLES } from '@/api/types';
import { ROUTES } from '@/constants/routes';
import { ActivityDetailPage } from '@/features/activities/ActivityDetailPage';
import { MyActivitiesPage } from '@/features/activities/MyActivitiesPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { RequireRole } from '@/features/auth/RequireRole';
import { AppLayout } from '@/features/layout/AppLayout';
import { ProjectDashboardPage } from '@/features/projects/ProjectDashboardPage';
import { ProjectsPage } from '@/features/projects/ProjectsPage';

import { NotFoundPage } from './NotFoundPage';
import { RootRedirect } from './RootRedirect';

import type { RouteObject } from 'react-router-dom';

export const appRoutes: RouteObject[] = [
  { path: ROUTES.LOGIN, element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: ROUTES.ROOT, element: <RootRedirect /> },
          {
            element: <RequireRole allowedRoles={[ROLES.REVIEWER]} />,
            children: [{ path: ROUTES.PROJECTS, element: <ProjectsPage /> }],
          },
          { path: ROUTES.PROJECT_DASHBOARD, element: <ProjectDashboardPage /> },
          { path: ROUTES.ACTIVITY_DETAIL, element: <ActivityDetailPage /> },
          {
            element: <RequireRole allowedRoles={[ROLES.REGISTRAR]} />,
            children: [{ path: ROUTES.MY_ACTIVITIES, element: <MyActivitiesPage /> }],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(appRoutes);
