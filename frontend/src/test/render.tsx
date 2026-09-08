import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { AuthProvider } from '@/features/auth/AuthProvider';
import { issueMockToken } from '@/mocks/auth';
import { usersFixture } from '@/mocks/fixtures';
import { setSession } from '@/session/session-store';
import { ThemeProvider } from '@/theme/ThemeProvider';

import type { Api } from '@/api/endpoints';
import type { Role, User } from '@/api/types';
import type { RouteObject } from 'react-router-dom';

/** An arbitrary token, for tests that only check that the client forwards what it was given. */
export const TEST_TOKEN = 'test-token';

/** Emails of the seed users of `docs/api/fixtures/users.json`, including the second registrar. */
export const SEED_USER_EMAIL = {
  REVIEWER: 'revisor@striker.local',
  REGISTRAR: 'registrador@striker.local',
  OTHER_REGISTRAR: 'registrador2@striker.local',
} as const;

/** The seed user with that email; throws rather than letting a test assert against `undefined`. */
export function seedUser(email: string): User {
  const user = usersFixture.find((candidate) => candidate.email === email);
  if (user === undefined) {
    throw new Error(`There is no seed user with the email ${email}`);
  }
  return user;
}

/** The first seed user holding that role. */
export function seedUserByRole(role: Role): User {
  const user = usersFixture.find((candidate) => candidate.role === role);
  if (user === undefined) {
    throw new Error(`There is no seed user with the role ${role}`);
  }
  return user;
}

/** One seed user per role, for tests that only need a user object. */
export const TEST_USERS: Record<Role, User> = {
  REVIEWER: seedUserByRole('REVIEWER'),
  REGISTRAR: seedUserByRole('REGISTRAR'),
};

/**
 * Signs a seed user in before rendering.
 *
 * The token is the one the MSW handlers issue and accept (`mock-token.<userId>`), so a test
 * that renders a component which calls the API is authenticated for real instead of getting
 * a 401 from the mock server.
 */
export function signInAsSeedUser(email: string): User {
  const user = seedUser(email);
  setSession({ accessToken: issueMockToken(user.id), user });
  return user;
}

/** Same, addressed by role. */
export function signInAs(role: Role): User {
  const user = seedUserByRole(role);
  setSession({ accessToken: issueMockToken(user.id), user });
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
