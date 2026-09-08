import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { ROUTES } from '@/constants/routes';

import { useAuth } from './useAuth';

import type { Location } from 'react-router-dom';

export interface LoginRedirectState {
  from: Location;
}

/** Route guard: unauthenticated visitors are sent to /login remembering where they came from. */
export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const state: LoginRedirectState = { from: location };
    return <Navigate to={ROUTES.LOGIN} replace state={state} />;
  }
  return <Outlet />;
}
