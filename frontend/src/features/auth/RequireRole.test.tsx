import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ROLES } from '@/api/types';
import { ROUTES } from '@/constants/routes';
import { renderWithRouter, signInAs } from '@/test/render';

import { RequireRole } from './RequireRole';

import type { RouteObject } from 'react-router-dom';

const REVIEWER_TEXT = 'Portafolio del revisor';
const HOME_TEXT = 'Inicio';

const routes: RouteObject[] = [
  { path: ROUTES.ROOT, element: <p>{HOME_TEXT}</p> },
  { path: ROUTES.LOGIN, element: <p>Login</p> },
  {
    element: <RequireRole allowedRoles={[ROLES.REVIEWER]} />,
    children: [{ path: ROUTES.PROJECTS, element: <p>{REVIEWER_TEXT}</p> }],
  },
];

describe('RequireRole', () => {
  it('renders the outlet for an allowed role', () => {
    signInAs(ROLES.REVIEWER);
    renderWithRouter({ routes, initialPath: ROUTES.PROJECTS });

    expect(screen.getByText(REVIEWER_TEXT)).toBeInTheDocument();
  });

  it('redirects a user with another role to the root route', () => {
    signInAs(ROLES.REGISTRAR);
    const { router } = renderWithRouter({ routes, initialPath: ROUTES.PROJECTS });

    expect(screen.getByText(HOME_TEXT)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(ROUTES.ROOT);
  });

  it('sends anonymous visitors to /login', () => {
    const { router } = renderWithRouter({ routes, initialPath: ROUTES.PROJECTS });

    expect(router.state.location.pathname).toBe(ROUTES.LOGIN);
  });
});
