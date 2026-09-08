import activitiesJson from './activities.json';
import emptyEvmReportJson from './evm-report-empty-project.json';
import evmReportJson from './evm-report.json';
import projectJson from './project.json';
import usersJson from './users.json';

import type { Activity, EvmReport, Project, User } from '@/api/types';

/**
 * Verbatim copies of the shared fixtures in docs/api/fixtures (module M1):
 *   users.json, project.json, activities.json, evm-report.json, evm-report-empty-project.json
 * They are copied instead of imported across the package boundary so the frontend builds
 * on its own (Docker context). `fixtures-sync.test.ts` fails if a copy drifts from its source.
 */

/** JSON modules infer wide literal types (e.g. `string` for enums); narrow them to the contract. */
function fromFixture<TContract>(json: unknown): TContract {
  return json as TContract;
}

export const usersFixture = fromFixture<User[]>(usersJson);
export const projectFixture = fromFixture<Project>(projectJson);
export const activitiesFixture = fromFixture<Activity[]>(activitiesJson);
export const evmReportFixture = fromFixture<EvmReport>(evmReportJson);
export const emptyEvmReportFixture = fromFixture<EvmReport>(emptyEvmReportJson);
