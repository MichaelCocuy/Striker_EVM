import { activitiesFixture, projectFixture, usersFixture } from './fixtures';

import type { Activity, Project, User } from '@/api/types';

/**
 * Seed data for mock mode, taken verbatim from docs/api/fixtures (same fixed UUIDs as the
 * backend init.sql): the seed users of ARQUITECTURA §11 and the "Portal de clientes"
 * project of EVM_GUIA §6. Local demo only: the password is documented in the README.
 */
export const SEED_PASSWORD = 'Striker2026!';

/** Fixed UUIDs from docs/api/README.md; a test asserts they match the fixture files. */
export const SEED_IDS = {
  REVIEWER: '11111111-1111-4111-8111-000000000001',
  REGISTRAR: '11111111-1111-4111-8111-000000000002',
  REGISTRAR_2: '11111111-1111-4111-8111-000000000003',
  PROJECT: '22222222-2222-4222-8222-000000000001',
  ACTIVITY_DESIGN: '33333333-3333-4333-8333-000000000001',
  ACTIVITY_DEVELOPMENT: '33333333-3333-4333-8333-000000000002',
  ACTIVITY_TESTING: '33333333-3333-4333-8333-000000000003',
} as const;

export const SEED_USERS: readonly User[] = usersFixture;

export const SEED_PROJECT: Project = projectFixture;

export const SEED_ACTIVITIES: readonly Activity[] = activitiesFixture;
