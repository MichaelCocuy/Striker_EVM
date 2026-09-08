import { BEARER_PREFIX, HTTP_HEADER } from '@/constants/http';

import { findUserById } from './db';

import type { MockDatabase, MockUser } from './db';

/** Opaque, unsigned token for mock mode: `mock-token.<userId>`. Never used against a real API. */
const MOCK_TOKEN_PREFIX = 'mock-token';
const TOKEN_SEPARATOR = '.';

export function issueMockToken(userId: string): string {
  return `${MOCK_TOKEN_PREFIX}${TOKEN_SEPARATOR}${userId}`;
}

export function parseMockToken(token: string): string | null {
  const [prefix, userId] = token.split(TOKEN_SEPARATOR);
  if (prefix !== MOCK_TOKEN_PREFIX || userId === undefined || userId === '') {
    return null;
  }
  return userId;
}

export function authenticateRequest(request: Request, db: MockDatabase): MockUser | null {
  const header = request.headers.get(HTTP_HEADER.AUTHORIZATION);
  if (header === null || !header.startsWith(BEARER_PREFIX)) {
    return null;
  }
  const userId = parseMockToken(header.slice(BEARER_PREFIX.length));
  if (userId === null) {
    return null;
  }
  return findUserById(db, userId) ?? null;
}
