import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { ROLES } from '@/api/types';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { setSession } from '@/session/session-store';
import { ThemeProvider } from '@/theme/ThemeProvider';

import type { Api } from '@/api/endpoints';
import type { Role, User } from '@/api/types';
import type { RouteObject } from 'react-router-dom';

export const TEST_TOKEN = 'test-token';

export const TEST_USERS: Record<Role, User> = {
  [ROLES.REVIEWER]: {
    id: 'user-reviewer',
    email: 'revisor@striker.local',
    fullName: 'Laura Revisora',
    role: ROLES.REVIEWER,
  },
  [ROLES.REGISTRAR]: {
    id: 'user-registrar',
    email: 'registrador@striker.local',
    fullName: 'Carlos Registrador',
    role: ROLES.REGISTRAR,
  },
};

/** Puts a signed-in user into the shared session store before rendering. */
export function signInAs(role: Role): User {
  const user = TEST_USERS[role];
  setSession({ accessToken: TEST_TOKEN, user });
  return user;
}

interface RenderWithRouterOptions {
  routes: RouteObject[];
  initialPath: string;
  authApi?: Pick<Api, 'login'>;
}

/** Renders routes inside the app providers with an in-memory router. */
export function renderWithRouter({ routes, initialPath, authApi }: RenderWithRouterOptions) {
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });
  const view = render(
    <ThemeProvider>
      <AuthProvider {...(authApi ? { authApi } : {})}>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>,
  );
  return { ...view, router };
}
