/**
 * Hand-written mirror of the API contract in docs/ARQUITECTURA.md §5.
 *
 * This file is the single place where wire types live so it can be swapped for types
 * generated from docs/api/openapi.yaml (module M1) without touching feature code.
 * All payloads are camelCase JSON; money is a number with two decimals and indices are
 * numbers with four decimals (or null when not computable).
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

export const TOKEN_TYPE_BEARER = 'bearer';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: typeof TOKEN_TYPE_BEARER;
  user: User;
}

export interface HealthResponse {
  status: string;
  database: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  activityCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectInput {
  name: string;
  description?: string | null;
}

/** Owner as embedded in an Activity: enough to render a name and check ownership. */
export interface ActivityOwner {
  id: string;
  fullName: string;
  email: string;
}

export interface Activity {
  id: string;
  projectId: string;
  name: string;
  owner: ActivityOwner;
  budgetAtCompletion: number;
  plannedProgressPercent: number;
  actualProgressPercent: number;
  actualCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityInput {
  name: string;
  /** Optional for REGISTRAR (assigned to themselves); required for REVIEWER. */
  ownerId?: string;
  budgetAtCompletion: number;
  plannedProgressPercent: number;
  actualProgressPercent: number;
  actualCost: number;
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

export interface EvmReportProject {
  id: string;
  name: string;
  indicators: EvmIndicators;
}

export interface EvmReportActivity {
  id: string;
  name: string;
  input: ActivityInput;
  indicators: EvmIndicators;
}

export interface EvmReport {
  project: EvmReportProject;
  activities: EvmReportActivity[];
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details: unknown[];
}
