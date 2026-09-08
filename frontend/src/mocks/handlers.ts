import { http, HttpResponse } from 'msw';

import { API_PATHS } from '@/api/endpoints';
import { COST_STATUS, ROLES, SCHEDULE_STATUS } from '@/api/types';
import { env } from '@/config/env';
import { HTTP_STATUS } from '@/constants/http';

import { authenticateRequest, issueMockToken } from './auth';
import {
  countActivities,
  findActivity,
  findProject,
  findUserByEmail,
  findUserById,
  mockDb,
  newId,
  nowIso,
  toPublicUser,
  withActivityCount,
} from './db';
import { PORTAL_DE_CLIENTES_REPORT } from './fixtures/portal-de-clientes-report';
import { SEED_IDS } from './seed';

import type { MockDatabase, MockUser } from './db';
import type {
  Activity,
  ActivityInput,
  ActivityOwner,
  ApiErrorBody,
  EvmIndicators,
  EvmReport,
  LoginRequest,
  LoginResponse,
  Project,
  ProjectInput,
} from '@/api/types';
import type { HttpHandler } from 'msw';

export const MOCK_ERROR_CODE = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
} as const;

const MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  MISSING_TOKEN: 'Missing or invalid bearer token',
  REVIEWER_ONLY: 'Only REVIEWER users can perform this action',
  NOT_OWNER: 'REGISTRAR users can only modify their own activities',
  PROJECT_NOT_FOUND: 'Project not found',
  ACTIVITY_NOT_FOUND: 'Activity not found',
  OWNER_NOT_FOUND: 'ownerId does not match any user',
  OWNER_REQUIRED: 'ownerId is required for REVIEWER users',
  NAME_REQUIRED: 'name must not be empty',
  BAC_POSITIVE: 'budgetAtCompletion must be greater than 0',
  PERCENT_RANGE: 'progress percentages must be between 0 and 100',
  AC_NON_NEGATIVE: 'actualCost must be greater than or equal to 0',
  MOCK_REPORT_UNAVAILABLE:
    'Mock mode only serves the fixture report for the seeded project; the backend computes real indicators',
} as const;

const PERCENT_MIN = 0;
const PERCENT_MAX = 100;

const ROUTE = {
  projectId: 'projectId',
  activityId: 'activityId',
} as const;

/** Route templates with MSW path params (API_PATHS helpers URL-encode, so they cannot be reused here). */
const MOCK_ROUTES = {
  project: `${API_PATHS.PROJECTS}/:${ROUTE.projectId}`,
  activities: `${API_PATHS.PROJECTS}/:${ROUTE.projectId}/activities`,
  activity: `${API_PATHS.PROJECTS}/:${ROUTE.projectId}/activities/:${ROUTE.activityId}`,
  evm: `${API_PATHS.PROJECTS}/:${ROUTE.projectId}/evm`,
} as const;

/** Handlers match any origin so they work in the browser (relative URLs) and in Node tests. */
function pattern(path: string): string {
  return `*${env.apiBaseUrl}${path}`;
}

function errorResponse(status: number, code: string, message: string, details: unknown[] = []) {
  const body: ApiErrorBody = { code, message, details };
  return HttpResponse.json(body, { status });
}

const unauthorized = () =>
  errorResponse(HTTP_STATUS.UNAUTHORIZED, MOCK_ERROR_CODE.UNAUTHORIZED, MESSAGES.MISSING_TOKEN);

const forbidden = (message: string) =>
  errorResponse(HTTP_STATUS.FORBIDDEN, MOCK_ERROR_CODE.FORBIDDEN, message);

const notFound = (message: string) =>
  errorResponse(HTTP_STATUS.NOT_FOUND, MOCK_ERROR_CODE.NOT_FOUND, message);

const validationError = (message: string) =>
  errorResponse(HTTP_STATUS.BAD_REQUEST, MOCK_ERROR_CODE.VALIDATION_ERROR, message);

function readParam(params: Record<string, string | readonly string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === 'string' ? value : '';
}

function isReviewer(user: MockUser): boolean {
  return user.role === ROLES.REVIEWER;
}

function validateProjectInput(input: Partial<ProjectInput>): string | null {
  if (typeof input.name !== 'string' || input.name.trim() === '') {
    return MESSAGES.NAME_REQUIRED;
  }
  return null;
}

function isPercent(value: unknown): value is number {
  return typeof value === 'number' && value >= PERCENT_MIN && value <= PERCENT_MAX;
}

function validateActivityInput(input: Partial<ActivityInput>): string | null {
  if (typeof input.name !== 'string' || input.name.trim() === '') {
    return MESSAGES.NAME_REQUIRED;
  }
  if (typeof input.budgetAtCompletion !== 'number' || input.budgetAtCompletion <= 0) {
    return MESSAGES.BAC_POSITIVE;
  }
  if (!isPercent(input.plannedProgressPercent) || !isPercent(input.actualProgressPercent)) {
    return MESSAGES.PERCENT_RANGE;
  }
  if (typeof input.actualCost !== 'number' || input.actualCost < 0) {
    return MESSAGES.AC_NON_NEGATIVE;
  }
  return null;
}

interface OwnerResolution {
  owner?: ActivityOwner;
  error?: ReturnType<typeof validationError>;
}

function resolveOwner(db: MockDatabase, user: MockUser, input: ActivityInput): OwnerResolution {
  if (!isReviewer(user)) {
    return { owner: { id: user.id, fullName: user.fullName, email: user.email } };
  }
  if (input.ownerId === undefined || input.ownerId === '') {
    return { error: validationError(MESSAGES.OWNER_REQUIRED) };
  }
  const ownerUser = findUserById(db, input.ownerId);
  if (ownerUser === undefined) {
    return { error: validationError(MESSAGES.OWNER_NOT_FOUND) };
  }
  return { owner: { id: ownerUser.id, fullName: ownerUser.fullName, email: ownerUser.email } };
}

function canModifyActivity(user: MockUser, activity: Activity): boolean {
  return isReviewer(user) || activity.owner.id === user.id;
}

function emptyReportFor(project: Project): EvmReport {
  const zeroIndicators: EvmIndicators = {
    budgetAtCompletion: 0,
    plannedValue: 0,
    earnedValue: 0,
    actualCost: 0,
    costVariance: 0,
    scheduleVariance: 0,
    costPerformanceIndex: null,
    schedulePerformanceIndex: null,
    estimateAtCompletion: null,
    varianceAtCompletion: null,
    costStatus: COST_STATUS.NOT_APPLICABLE,
    scheduleStatus: SCHEDULE_STATUS.NOT_APPLICABLE,
    notes: [MESSAGES.MOCK_REPORT_UNAVAILABLE],
  };
  return {
    project: { id: project.id, name: project.name, indicators: zeroIndicators },
    activities: [],
  };
}

export function createHandlers(db: MockDatabase = mockDb): HttpHandler[] {
  const requireUser = (request: Request) => authenticateRequest(request, db);

  return [
    http.get(pattern(API_PATHS.HEALTH), () =>
      HttpResponse.json({ status: 'ok', database: 'mock' }),
    ),

    http.post(pattern(API_PATHS.LOGIN), async ({ request }) => {
      const credentials = (await request.json()) as Partial<LoginRequest>;
      if (typeof credentials.email !== 'string' || typeof credentials.password !== 'string') {
        return validationError('email and password are required');
      }
      const user = findUserByEmail(db, credentials.email);
      if (user === undefined || user.password !== credentials.password) {
        return errorResponse(
          HTTP_STATUS.UNAUTHORIZED,
          MOCK_ERROR_CODE.UNAUTHORIZED,
          MESSAGES.INVALID_CREDENTIALS,
        );
      }
      const body: LoginResponse = {
        accessToken: issueMockToken(user.id),
        tokenType: 'bearer',
        user: toPublicUser(user),
      };
      return HttpResponse.json(body);
    }),

    http.get(pattern(API_PATHS.ME), ({ request }) => {
      const user = requireUser(request);
      return user === null ? unauthorized() : HttpResponse.json(toPublicUser(user));
    }),

    http.get(pattern(API_PATHS.USERS), ({ request }) => {
      const user = requireUser(request);
      if (user === null) {
        return unauthorized();
      }
      if (!isReviewer(user)) {
        return forbidden(MESSAGES.REVIEWER_ONLY);
      }
      return HttpResponse.json(db.users.map(toPublicUser));
    }),

    http.get(pattern(API_PATHS.PROJECTS), ({ request }) => {
      const user = requireUser(request);
      if (user === null) {
        return unauthorized();
      }
      return HttpResponse.json(db.projects.map((project) => withActivityCount(db, project)));
    }),

    http.post(pattern(API_PATHS.PROJECTS), async ({ request }) => {
      const user = requireUser(request);
      if (user === null) {
        return unauthorized();
      }
      if (!isReviewer(user)) {
        return forbidden(MESSAGES.REVIEWER_ONLY);
      }
      const input = (await request.json()) as Partial<ProjectInput>;
      const validationMessage = validateProjectInput(input);
      if (validationMessage !== null || input.name === undefined) {
        return validationError(validationMessage ?? MESSAGES.NAME_REQUIRED);
      }
      const timestamp = nowIso();
      const project: Project = {
        id: newId(),
        name: input.name.trim(),
        description: input.description ?? null,
        createdBy: user.id,
        activityCount: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      db.projects.push(project);
      return HttpResponse.json(project, { status: HTTP_STATUS.CREATED });
    }),

    http.get(pattern(MOCK_ROUTES.project), ({ request, params }) => {
      const user = requireUser(request);
      if (user === null) {
        return unauthorized();
      }
      const project = findProject(db, readParam(params, ROUTE.projectId));
      return project === undefined
        ? notFound(MESSAGES.PROJECT_NOT_FOUND)
        : HttpResponse.json(withActivityCount(db, project));
    }),

    http.put(pattern(MOCK_ROUTES.project), async ({ request, params }) => {
      const user = requireUser(request);
      if (user === null) {
        return unauthorized();
      }
      if (!isReviewer(user)) {
        return forbidden(MESSAGES.REVIEWER_ONLY);
      }
      const project = findProject(db, readParam(params, ROUTE.projectId));
      if (project === undefined) {
        return notFound(MESSAGES.PROJECT_NOT_FOUND);
      }
      const input = (await request.json()) as Partial<ProjectInput>;
      const validationMessage = validateProjectInput(input);
      if (validationMessage !== null || input.name === undefined) {
        return validationError(validationMessage ?? MESSAGES.NAME_REQUIRED);
      }
      project.name = input.name.trim();
      project.description = input.description ?? null;
      project.updatedAt = nowIso();
      return HttpResponse.json(withActivityCount(db, project));
    }),

    http.delete(pattern(MOCK_ROUTES.project), ({ request, params }) => {
      const user = requireUser(request);
      if (user === null) {
        return unauthorized();
      }
      if (!isReviewer(user)) {
        return forbidden(MESSAGES.REVIEWER_ONLY);
      }
      const projectId = readParam(params, ROUTE.projectId);
      if (findProject(db, projectId) === undefined) {
        return notFound(MESSAGES.PROJECT_NOT_FOUND);
      }
      db.projects = db.projects.filter((project) => project.id !== projectId);
      db.activities = db.activities.filter((activity) => activity.projectId !== projectId);
      return new HttpResponse(null, { status: HTTP_STATUS.NO_CONTENT });
    }),

    http.get(pattern(MOCK_ROUTES.activities), ({ request, params }) => {
      const user = requireUser(request);
      if (user === null) {
        return unauthorized();
      }
      const projectId = readParam(params, ROUTE.projectId);
      if (findProject(db, projectId) === undefined) {
        return notFound(MESSAGES.PROJECT_NOT_FOUND);
      }
      return HttpResponse.json(
        db.activities.filter((activity) => activity.projectId === projectId),
      );
    }),

    http.post(pattern(MOCK_ROUTES.activities), async ({ request, params }) => {
      const user = requireUser(request);
      if (user === null) {
        return unauthorized();
      }
      const project = findProject(db, readParam(params, ROUTE.projectId));
      if (project === undefined) {
        return notFound(MESSAGES.PROJECT_NOT_FOUND);
      }
      const input = (await request.json()) as ActivityInput;
      const validationMessage = validateActivityInput(input);
      if (validationMessage !== null) {
        return validationError(validationMessage);
      }
      const { owner, error } = resolveOwner(db, user, input);
      if (error !== undefined || owner === undefined) {
        return error ?? validationError(MESSAGES.OWNER_REQUIRED);
      }
      const timestamp = nowIso();
      const activity: Activity = {
        id: newId(),
        projectId: project.id,
        name: input.name.trim(),
        owner,
        budgetAtCompletion: input.budgetAtCompletion,
        plannedProgressPercent: input.plannedProgressPercent,
        actualProgressPercent: input.actualProgressPercent,
        actualCost: input.actualCost,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      db.activities.push(activity);
      project.activityCount = countActivities(db, project.id);
      return HttpResponse.json(activity, { status: HTTP_STATUS.CREATED });
    }),

    http.put(pattern(MOCK_ROUTES.activity), async ({ request, params }) => {
      const user = requireUser(request);
      if (user === null) {
        return unauthorized();
      }
      const projectId = readParam(params, ROUTE.projectId);
      if (findProject(db, projectId) === undefined) {
        return notFound(MESSAGES.PROJECT_NOT_FOUND);
      }
      const activity = findActivity(db, projectId, readParam(params, ROUTE.activityId));
      if (activity === undefined) {
        return notFound(MESSAGES.ACTIVITY_NOT_FOUND);
      }
      if (!canModifyActivity(user, activity)) {
        return forbidden(MESSAGES.NOT_OWNER);
      }
      const input = (await request.json()) as ActivityInput;
      const validationMessage = validateActivityInput(input);
      if (validationMessage !== null) {
        return validationError(validationMessage);
      }
      const { owner, error } = resolveOwner(db, user, input);
      if (error !== undefined || owner === undefined) {
        return error ?? validationError(MESSAGES.OWNER_REQUIRED);
      }
      Object.assign(activity, {
        name: input.name.trim(),
        owner,
        budgetAtCompletion: input.budgetAtCompletion,
        plannedProgressPercent: input.plannedProgressPercent,
        actualProgressPercent: input.actualProgressPercent,
        actualCost: input.actualCost,
        updatedAt: nowIso(),
      });
      return HttpResponse.json(activity);
    }),

    http.delete(pattern(MOCK_ROUTES.activity), ({ request, params }) => {
      const user = requireUser(request);
      if (user === null) {
        return unauthorized();
      }
      const projectId = readParam(params, ROUTE.projectId);
      const project = findProject(db, projectId);
      if (project === undefined) {
        return notFound(MESSAGES.PROJECT_NOT_FOUND);
      }
      const activity = findActivity(db, projectId, readParam(params, ROUTE.activityId));
      if (activity === undefined) {
        return notFound(MESSAGES.ACTIVITY_NOT_FOUND);
      }
      if (!canModifyActivity(user, activity)) {
        return forbidden(MESSAGES.NOT_OWNER);
      }
      db.activities = db.activities.filter((candidate) => candidate.id !== activity.id);
      project.activityCount = countActivities(db, project.id);
      return new HttpResponse(null, { status: HTTP_STATUS.NO_CONTENT });
    }),

    http.get(pattern(MOCK_ROUTES.evm), ({ request, params }) => {
      const user = requireUser(request);
      if (user === null) {
        return unauthorized();
      }
      const project = findProject(db, readParam(params, ROUTE.projectId));
      if (project === undefined) {
        return notFound(MESSAGES.PROJECT_NOT_FOUND);
      }
      const report =
        project.id === SEED_IDS.PROJECT ? PORTAL_DE_CLIENTES_REPORT : emptyReportFor(project);
      return HttpResponse.json(report);
    }),
  ];
}

export const handlers: HttpHandler[] = createHandlers();
