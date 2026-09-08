import { issueMockToken } from '@/mocks/auth';
import { usersFixture } from '@/mocks/fixtures';
import { setSession } from '@/session/session-store';

import type { User } from '@/api/types';

/**
 * Test helpers for module M8. `src/test/render.tsx` signs in with a synthetic user whose id
 * does not exist in the mock database, so these tests sign in with a seed user and a token
 * the MSW handlers accept, which is what the activity endpoints need.
 */
export const SEED_USER_EMAIL = {
  REVIEWER: 'revisor@striker.local',
  REGISTRAR: 'registrador@striker.local',
  OTHER_REGISTRAR: 'registrador2@striker.local',
} as const;

export function seedUser(email: string): User {
  const user = usersFixture.find((candidate) => candidate.email === email);
  if (user === undefined) {
    throw new Error(`There is no seed user with the email ${email}`);
  }
  return user;
}

export function signInAsSeedUser(email: string): User {
  const user = seedUser(email);
  setSession({ accessToken: issueMockToken(user.id), user });
  return user;
}
