import { Navigate } from 'react-router-dom';

import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/features/auth/useAuth';
import { HOME_ROUTE_BY_ROLE } from '@/features/layout/nav-items';

/** `/` sends each role to its home: REVIEWER → portfolio, REGISTRAR → my activities. */
export function RootRedirect() {
  const { user } = useAuth();
  const destination = user === null ? ROUTES.LOGIN : HOME_ROUTE_BY_ROLE[user.role];
  return <Navigate to={destination} replace />;
}
