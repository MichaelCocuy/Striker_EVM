import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ROLES } from '@/api/types';
import { ROUTES } from '@/constants/routes';
import { renderWithRouter, signInAs } from '@/test/render';

import { RequireAuth } from './RequireAuth';

import type { RouteObject } from 'react-router-dom';

const PROTECTED_TEXT = 'Contenido protegido';
const LOGIN_TEXT = 'Pantalla de login';

const routes: RouteObject[] = [
  { path: ROUTES.LOGIN, element: <p>{LOGIN_TEXT}</p> },
  {
    element: <RequireAuth />,
    children: [{ path: ROUTES.PROJECTS, element: <p>{PROTECTED_TEXT}</p> }],
  },
];

describe('RequireAuth', () => {
  it('redirects anonymous visitors to /login and remembers the origin', () => {
    const { router } = renderWithRouter({ routes, initialPath: ROUTES.PROJECTS });

    expect(screen.getByText(LOGIN_TEXT)).toBeInTheDocument();
    expect(screen.queryByText(PROTECTED_TEXT)).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe(ROUTES.LOGIN);
    expect(router.state.location.state).toMatchObject({ from: { pathname: ROUTES.PROJECTS } });
  });

  it('renders the protected outlet when a session exists', () => {
    signInAs(ROLES.REVIEWER);
    renderWithRouter({ routes, initialPath: ROUTES.PROJECTS });

    expect(screen.getByText(PROTECTED_TEXT)).toBeInTheDocument();
  });
});
