/**
 * Hand-written mirror of docs/api/openapi.yaml (components/schemas).
 *
 * This file is the single place where wire types live so it can be swapped for types
 * generated from the OpenAPI document without touching feature code. Names follow the
 * contract schemas. All payloads are camelCase JSON; money is a number with two decimals
 * and indices are numbers with four decimals (or null when not computable).
 */

export const ROLES = {
  REGISTRAR: 'REGISTRAR',
  REVIEWER: 'REVIEWER',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const COST_STATUS = {
  UNDER_BUDGET: 'UNDER_BUDGET',
  ON_BUDGET: 'ON_BUDGET',
  OVER_BUDGET: 'OVER_BUDGET',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
} as const;

export type CostStatus = (typeof COST_STATUS)[keyof typeof COST_STATUS];

export const SCHEDULE_STATUS = {
  AHEAD_OF_SCHEDULE: 'AHEAD_OF_SCHEDULE',
  ON_SCHEDULE: 'ON_SCHEDULE',
  BEHIND_SCHEDULE: 'BEHIND_SCHEDULE',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
} as const;

export type ScheduleStatus = (typeof SCHEDULE_STATUS)[keyof typeof SCHEDULE_STATUS];

/** Contract `ErrorCode` catalogue plus the client-side codes used when no API body exists. */
export const ERROR_CODE = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  /** Non-JSON or unexpected HTTP failure. */
  HTTP_ERROR: 'HTTP_ERROR',
  /** The request never reached the server (offline, CORS, aborted). */
  NETWORK_ERROR: 'NETWORK_ERROR',
  /** The server answered 2xx with a body that is not valid JSON. */
  INVALID_RESPONSE: 'INVALID_RESPONSE',
} as const;

export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];

export const TOKEN_TYPE_BEARER = 'bearer';
export const HEALTH_OK = 'ok';

/** `UserSummary`: reference to a user embedded in projects and activities. */
export interface UserSummary {
  id: string;
  fullName: string;
}

export interface User extends UserSummary {
  email: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: typeof TOKEN_TYPE_BEARER;
  /** Seconds of validity since issuance (8 hours). */
  expiresIn: number;
  user: User;
}

export interface HealthResponse {
  status: typeof HEALTH_OK;
  database: typeof HEALTH_OK;
  version?: string;
}

export interface ProjectInput {
  name: string;
  description?: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  activityCount: number;
  createdBy: UserSummary;
  createdAt: string;
  updatedAt: string;
}

/** `ActivityMeasures`: the four raw numbers the EVM calculation is based on. */
export interface ActivityMeasures {
  budgetAtCompletion: number;
  plannedProgressPercent: number;
  actualProgressPercent: number;
  actualCost: number;
}

/** POST/PUT body. `ownerId` is optional for REGISTRAR (self) and required for REVIEWER. */
export type ActivityInput = ActivityMeasures & {
  name: string;
  ownerId?: string | null;
};

export interface Activity extends ActivityMeasures {
  id: string;
  projectId: string;
  name: string;
  owner: UserSummary;
  createdAt: string;
  updatedAt: string;
}

export interface EvmIndicators {
  budgetAtCompletion: number;
  plannedValue: number;
  earnedValue: number;
  actualCost: number;
  costVariance: number;
  scheduleVariance: number;
  costPerformanceIndex: number | null;
  schedulePerformanceIndex: number | null;
  estimateAtCompletion: number | null;
  varianceAtCompletion: number | null;
  costStatus: CostStatus;
  scheduleStatus: ScheduleStatus;
  notes: string[];
}

export interface EvmProjectSummary {
  id: string;
  name: string;
  indicators: EvmIndicators;
}

export interface EvmActivityReport {
  id: string;
  name: string;
  owner: UserSummary;
  input: ActivityMeasures;
  indicators: EvmIndicators;
}

export interface EvmReport {
  project: EvmProjectSummary;
  activities: EvmActivityReport[];
  /** UTC instant at which the report was computed. */
  generatedAt: string;
}

export interface ErrorDetail {
  /** camelCase field name the detail applies to, or null when general. */
  field?: string | null;
  message: string;
}

export interface ApiErrorBody {
  code: ErrorCode;
  message: string;
  details: ErrorDetail[];
}
