import { ROLES } from '@/api/types';

import type { Activity, Project, User } from '@/api/types';

/**
 * Seed data mirroring backend/db/init.sql (ARQUITECTURA §11) and the worked example in
 * EVM_GUIA.md §6 ("Portal de clientes" with Diseño / Desarrollo / Pruebas).
 * Local demo only: the password is documented in the README.
 */
export const SEED_PASSWORD = 'Striker2026!';

export const SEED_IDS = {
  REVIEWER: '11111111-1111-4111-8111-111111111111',
  REGISTRAR: '22222222-2222-4222-8222-222222222222',
  REGISTRAR_2: '33333333-3333-4333-8333-333333333333',
  PROJECT: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  ACTIVITY_DESIGN: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  ACTIVITY_DEVELOPMENT: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
  ACTIVITY_TESTING: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
} as const;

const SEED_TIMESTAMP = '2026-09-08T12:00:00Z';

export const SEED_USERS: readonly User[] = [
  {
    id: SEED_IDS.REVIEWER,
    email: 'revisor@striker.local',
    fullName: 'Laura Revisora',
    role: ROLES.REVIEWER,
  },
  {
    id: SEED_IDS.REGISTRAR,
    email: 'registrador@striker.local',
    fullName: 'Carlos Registrador',
    role: ROLES.REGISTRAR,
  },
  {
    id: SEED_IDS.REGISTRAR_2,
    email: 'registrador2@striker.local',
    fullName: 'Ana Registradora',
    role: ROLES.REGISTRAR,
  },
];

export const SEED_PROJECT: Project = {
  id: SEED_IDS.PROJECT,
  name: 'Portal de clientes',
  description: 'Proyecto de ejemplo de la guía EVM: diseño, desarrollo y pruebas del portal.',
  createdBy: SEED_IDS.REVIEWER,
  activityCount: 3,
  createdAt: SEED_TIMESTAMP,
  updatedAt: SEED_TIMESTAMP,
};

function owner(userId: string) {
  const user = SEED_USERS.find((candidate) => candidate.id === userId);
  if (user === undefined) {
    throw new Error(`Unknown seed user ${userId}`);
  }
  return { id: user.id, fullName: user.fullName, email: user.email };
}

export const SEED_ACTIVITIES: readonly Activity[] = [
  {
    id: SEED_IDS.ACTIVITY_DESIGN,
    projectId: SEED_IDS.PROJECT,
    name: 'Diseño',
    owner: owner(SEED_IDS.REGISTRAR),
    budgetAtCompletion: 10000.0,
    plannedProgressPercent: 100.0,
    actualProgressPercent: 100.0,
    actualCost: 9000.0,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: SEED_IDS.ACTIVITY_DEVELOPMENT,
    projectId: SEED_IDS.PROJECT,
    name: 'Desarrollo',
    owner: owner(SEED_IDS.REGISTRAR),
    budgetAtCompletion: 40000.0,
    plannedProgressPercent: 50.0,
    actualProgressPercent: 40.0,
    actualCost: 20000.0,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: SEED_IDS.ACTIVITY_TESTING,
    projectId: SEED_IDS.PROJECT,
    name: 'Pruebas',
    owner: owner(SEED_IDS.REGISTRAR_2),
    budgetAtCompletion: 10000.0,
    plannedProgressPercent: 20.0,
    actualProgressPercent: 30.0,
    actualCost: 2500.0,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
];
