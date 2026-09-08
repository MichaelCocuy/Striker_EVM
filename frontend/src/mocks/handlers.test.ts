import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApiClient } from '@/api/client';
import { createApi } from '@/api/endpoints';
import { ApiError } from '@/api/errors';
import { HTTP_STATUS } from '@/constants/http';
import { setSession } from '@/session/session-store';

import { resetMockDatabase } from './db';
import { evmReportFixture } from './fixtures';
import { SEED_IDS, SEED_PASSWORD, SEED_USERS } from './seed';
import { mockServer } from './server';

import type { LoginResponse } from '@/api/types';

const BASE_URL = 'http://localhost/api/v1';
const api = createApi(createApiClient(BASE_URL));

const reviewerEmail = 'revisor@striker.local';
const registrarEmail = 'registrador@striker.local';
/** docs/api/fixtures/login-response.json */
const EXPECTED_EXPIRES_IN = 28800;

async function signIn(email: string): Promise<LoginResponse> {
  const response = await api.login({ email, password: SEED_PASSWORD });
  setSession({ accessToken: response.accessToken, user: response.user });
  return response;
}

async function expectStatus(promise: Promise<unknown>, status: number): Promise<void> {
  const failure = await promise.catch((error: unknown) => error);
  expect(failure).toBeInstanceOf(ApiError);
  expect((failure as ApiError).status).toBe(status);
}

beforeAll(() => mockServer.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetMockDatabase());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe('MSW handlers', () => {
  it('logs in every seed user with the documented password', async () => {
    for (const seedUser of SEED_USERS) {
      const response = await api.login({ email: seedUser.email, password: SEED_PASSWORD });
      expect(response.user).toEqual(seedUser);
      expect(response.tokenType).toBe('bearer');
      expect(response.expiresIn).toBe(EXPECTED_EXPIRES_IN);
    }
  });

  it('rejects wrong credentials with 401', async () => {
    await expectStatus(
      api.login({ email: reviewerEmail, password: 'nope' }),
      HTTP_STATUS.UNAUTHORIZED,
    );
  });

  it('requires a bearer token on protected endpoints', async () => {
    await expectStatus(api.listProjects(), HTTP_STATUS.UNAUTHORIZED);
  });

  it('returns the seeded project with its activity count', async () => {
    await signIn(reviewerEmail);
    const projects = await api.listProjects();

    expect(projects).toHaveLength(1);
    expect(projects[0]).toMatchObject({
      id: SEED_IDS.PROJECT,
      name: 'Portal de clientes',
      activityCount: 3,
      createdBy: { id: SEED_IDS.REVIEWER, fullName: 'Laura Revisora' },
    });
  });

  it('embeds owners as UserSummary without an email', async () => {
    await signIn(reviewerEmail);
    const activities = await api.listActivities(SEED_IDS.PROJECT);

    expect(activities.map((activity) => activity.owner)).toEqual([
      { id: SEED_IDS.REGISTRAR, fullName: 'Carlos Registrador' },
      { id: SEED_IDS.REGISTRAR_2, fullName: 'Ana Registradora' },
      { id: SEED_IDS.REGISTRAR, fullName: 'Carlos Registrador' },
    ]);
  });

  it('serves the exact EVM report from EVM_GUIA §6.5 and §6.6 for the seeded project', async () => {
    await signIn(registrarEmail);
    const report = await api.getEvmReport(SEED_IDS.PROJECT);

    expect(report).toEqual(evmReportFixture);
    expect(report.project.indicators.costPerformanceIndex).toBe(0.9206);
    expect(report.project.indicators.schedulePerformanceIndex).toBe(0.9063);
    expect(report.project.indicators.estimateAtCompletion).toBe(65172.41);
    expect(report.project.indicators.varianceAtCompletion).toBe(-5172.41);
    expect(report.activities.map((activity) => activity.name)).toEqual([
      'Diseño',
      'Desarrollo',
      'Pruebas',
    ]);
    expect(report.generatedAt).toBe('2026-09-08T12:00:00Z');
    // EvmActivityReport.input carries only the four ActivityMeasures fields.
    expect(Object.keys(report.activities[0]?.input ?? {})).toEqual([
      'budgetAtCompletion',
      'plannedProgressPercent',
      'actualProgressPercent',
      'actualCost',
    ]);
  });

  it('reports a project created in mock mode with the empty-project indicators', async () => {
    await signIn(reviewerEmail);
    const created = await api.createProject({ name: 'Intranet' });

    const report = await api.getEvmReport(created.id);

    expect(report.project.id).toBe(created.id);
    expect(report.activities).toEqual([]);
    expect(report.project.indicators.costStatus).toBe('NOT_APPLICABLE');
    expect(report.generatedAt).toEqual(expect.any(String));
  });

  it('forbids REGISTRAR from creating projects and listing users', async () => {
    await signIn(registrarEmail);

    await expectStatus(api.createProject({ name: 'Nuevo' }), HTTP_STATUS.FORBIDDEN);
    await expectStatus(api.listUsers(), HTTP_STATUS.FORBIDDEN);
  });

  it('lets REVIEWER create, update and delete a project', async () => {
    await signIn(reviewerEmail);

    const created = await api.createProject({ name: 'Intranet', description: 'Piloto' });
    expect(created.activityCount).toBe(0);

    const updated = await api.updateProject(created.id, { name: 'Intranet 2' });
    expect(updated.name).toBe('Intranet 2');

    await api.deleteProject(created.id);
    await expectStatus(api.getProject(created.id), HTTP_STATUS.NOT_FOUND);
  });

  it('assigns the REGISTRAR as owner of the activities they create', async () => {
    const { user } = await signIn(registrarEmail);

    const activity = await api.createActivity(SEED_IDS.PROJECT, {
      name: 'Despliegue',
      budgetAtCompletion: 5000,
      plannedProgressPercent: 10,
      actualProgressPercent: 0,
      actualCost: 0,
    });

    expect(activity.owner.id).toBe(user.id);
    const project = await api.getProject(SEED_IDS.PROJECT);
    expect(project.activityCount).toBe(4);
  });

  it('forbids REGISTRAR from editing or deleting activities owned by someone else', async () => {
    // Carlos owns Diseño and Pruebas; Desarrollo belongs to Ana (see fixtures/activities.json).
    await signIn(registrarEmail);
    const input = {
      name: 'Desarrollo',
      budgetAtCompletion: 40000,
      plannedProgressPercent: 50,
      actualProgressPercent: 40,
      actualCost: 20000,
    };

    await expectStatus(
      api.updateActivity(SEED_IDS.PROJECT, SEED_IDS.ACTIVITY_DEVELOPMENT, input),
      HTTP_STATUS.FORBIDDEN,
    );
    await expectStatus(
      api.deleteActivity(SEED_IDS.PROJECT, SEED_IDS.ACTIVITY_DEVELOPMENT),
      HTTP_STATUS.FORBIDDEN,
    );
    const own = await api.updateActivity(SEED_IDS.PROJECT, SEED_IDS.ACTIVITY_DESIGN, {
      ...input,
      name: 'Diseño',
    });
    expect(own.name).toBe('Diseño');
  });

  it('validates activity input with 400 and requires ownerId for REVIEWER', async () => {
    await signIn(reviewerEmail);
    const valid = {
      name: 'QA',
      ownerId: SEED_IDS.REGISTRAR_2,
      budgetAtCompletion: 1000,
      plannedProgressPercent: 50,
      actualProgressPercent: 50,
      actualCost: 100,
    };

    await expectStatus(
      api.createActivity(SEED_IDS.PROJECT, { ...valid, plannedProgressPercent: 120 }),
      HTTP_STATUS.BAD_REQUEST,
    );
    const { ownerId: _ownerId, ...withoutOwner } = valid;
    await expectStatus(api.createActivity(SEED_IDS.PROJECT, withoutOwner), HTTP_STATUS.BAD_REQUEST);
    const created = await api.createActivity(SEED_IDS.PROJECT, valid);
    expect(created.owner.id).toBe(SEED_IDS.REGISTRAR_2);
  });

  it('returns 404 for unknown projects', async () => {
    await signIn(reviewerEmail);
    await expectStatus(api.getEvmReport('missing'), HTTP_STATUS.NOT_FOUND);
    await expectStatus(api.listActivities('missing'), HTTP_STATUS.NOT_FOUND);
  });
});
