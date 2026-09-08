import { http, HttpResponse } from 'msw';

import { API_PATHS } from '@/api/endpoints';
import { ERROR_CODE, HEALTH_OK, ROLES, TOKEN_TYPE_BEARER } from '@/api/types';
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
import { emptyEvmReportFixture, evmReportFixture } from './fixtures';
import { SEED_IDS } from './seed';

import type { MockDatabase, MockUser } from './db';
import type {
  Activity,
  ActivityInput,
  ApiErrorBody,
  ErrorCode,
  ErrorDetail,
  EvmReport,
  HealthResponse,
  LoginRequest,
  LoginResponse,
  Project,
  ProjectInput,
  UserSummary,
} from '@/api/types';
import type { HttpHandler } from 'msw';

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

/** Matches `expiresIn` in docs/api/fixtures/login-response.json (8 hours). */
const TOKEN_EXPIRES_IN_SECONDS = 28800;
const MOCK_VERSION = 'mock';
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

function errorResponse(
  status: number,
  code: ErrorCode,
  message: string,
  details: ErrorDetail[] = [],
) {
  const body: ApiErrorBody = { code, message, details };
  return HttpResponse.json(body, { status });
}

const unauthorized = () =>
  errorResponse(HTTP_STATUS.UNAUTHORIZED, ERROR_CODE.UNAUTHORIZED, MESSAGES.MISSING_TOKEN);

const forbidden = (message: string) =>
  errorResponse(HTTP_STATUS.FORBIDDEN, ERROR_CODE.FORBIDDEN, message);

const notFound = (message: string) =>
  errorResponse(HTTP_STATUS.NOT_FOUND, ERROR_CODE.NOT_FOUND, message);

/** VALIDATION_ERROR carries one detail per invalid field, as in fixtures/error-validation.json. */
const validationError = (message: string, field: string | null = null) =>
  errorResponse(HTTP_STATUS.BAD_REQUEST, ERROR_CODE.VALIDATION_ERROR, message, [
    { field, message },
  ]);

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

const OWNER_ID_FIELD = 'ownerId';

interface OwnerResolution {
  owner?: UserSummary;
  error?: ReturnType<typeof validationError>;
}

function resolveOwner(db: MockDatabase, user: MockUser, input: ActivityInput): OwnerResolution {
  if (!isReviewer(user)) {
    return { owner: { id: user.id, fullName: user.fullName } };
  }
  if (input.ownerId === undefined || input.ownerId === null || input.ownerId === '') {
    return { error: validationError(MESSAGES.OWNER_REQUIRED, OWNER_ID_FIELD) };
  }
  const ownerUser = findUserById(db, input.ownerId);
  if (ownerUser === undefined) {
    return { error: validationError(MESSAGES.OWNER_NOT_FOUND, OWNER_ID_FIELD) };
  }
  return { owner: { id: ownerUser.id, fullName: ownerUser.fullName } };
}

function canModifyActivity(user: MockUser, activity: Activity): boolean {
  return isReviewer(user) || activity.owner.id === user.id;
}

/**
 * The seeded project returns the shared fixture verbatim (EVM_GUIA §6); the frontend never
 * computes EVM. Projects created in mock mode reuse the empty-project fixture's indicators
 * with their own identity, noting that only the backend produces real numbers.
 */
function reportFor(db: MockDatabase, project: Project): EvmReport {
  if (project.id === SEED_IDS.PROJECT) {
    return evmReportFixture;
  }
  const emptyIndicators = emptyEvmReportFixture.project.indicators;
  const notes =
    countActivities(db, project.id) === 0
      ? emptyIndicators.notes
      : [MESSAGES.MOCK_REPORT_UNAVAILABLE];
  return {
    project: { id: project.id, name: project.name, indicators: { ...emptyIndicators, notes } },
    activities: [],
    generatedAt: nowIso(),
  };
}

function healthResponse(): HealthResponse {
  return { status: HEALTH_OK, database: HEALTH_OK, version: MOCK_VERSION };
}

export function createHandlers(db: MockDatabase = mockDb): HttpHandler[] {
  const requireUser = (request: Request) => authenticateRequest(request, db);

  return [
    http.get(pattern(API_PATHS.HEALTH), () => HttpResponse.json(healthResponse())),

    http.post(pattern(API_PATHS.LOGIN), async ({ request }) => {
      const credentials = (await request.json()) as Partial<LoginRequest>;
      if (typeof credentials.email !== 'string' || typeof credentials.password !== 'string') {
        return validationError('email and password are required');
      }
      const user = findUserByEmail(db, credentials.email);
      if (user === undefined || user.password !== credentials.password) {
        return errorResponse(
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODE.UNAUTHORIZED,
          MESSAGES.INVALID_CREDENTIALS,
        );
      }
      const body: LoginResponse = {
        accessToken: issueMockToken(user.id),
        tokenType: TOKEN_TYPE_BEARER,
        expiresIn: TOKEN_EXPIRES_IN_SECONDS,
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
        createdBy: { id: user.id, fullName: user.fullName },
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
      return HttpResponse.json(reportFor(db, project));
    }),
  ];
}

export const handlers: HttpHandler[] = createHandlers();
