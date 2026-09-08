import { Navigate, Outlet } from 'react-router-dom';

import { ROUTES } from '@/constants/routes';

import { isRoleAllowed } from './permissions';
import { useAuth } from './useAuth';

import type { Role } from '@/api/types';

interface RequireRoleProps {
  allowedRoles: readonly Role[];
}

/** Route guard: signed-in users with a different role are redirected to their own home. */
export function RequireRole({ allowedRoles }: RequireRoleProps) {
  const { user } = useAuth();

  if (user === null) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  if (!isRoleAllowed(user.role, allowedRoles)) {
    return <Navigate to={ROUTES.ROOT} replace />;
  }
  return <Outlet />;
}
