import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { SEED_ACTIVITIES, SEED_IDS, SEED_PROJECT, SEED_USERS } from '../seed';
import {
  activitiesFixture,
  emptyEvmReportFixture,
  evmReportFixture,
  projectFixture,
  usersFixture,
} from './index';

/** Vitest runs with the frontend package as its working directory. */
const CANONICAL_FIXTURES_DIR = resolve(process.cwd(), '..', 'docs', 'api', 'fixtures');

function readCanonical(fileName: string): unknown {
  return JSON.parse(readFileSync(join(CANONICAL_FIXTURES_DIR, fileName), 'utf8')) as unknown;
}

describe('mock fixtures mirror docs/api/fixtures', () => {
  it.each([
    ['users.json', usersFixture],
    ['project.json', projectFixture],
    ['activities.json', activitiesFixture],
    ['evm-report.json', evmReportFixture],
    ['evm-report-empty-project.json', emptyEvmReportFixture],
  ])('%s is an exact copy of the canonical fixture', (fileName, copy) => {
    expect(copy).toEqual(readCanonical(fileName));
  });

  it('uses the fixed UUIDs documented in docs/api/README.md', () => {
    expect(SEED_USERS.map((user) => user.id)).toEqual([
      SEED_IDS.REVIEWER,
      SEED_IDS.REGISTRAR,
      SEED_IDS.REGISTRAR_2,
    ]);
    expect(SEED_PROJECT.id).toBe(SEED_IDS.PROJECT);
    expect(SEED_ACTIVITIES.map((activity) => activity.id)).toEqual([
      SEED_IDS.ACTIVITY_DESIGN,
      SEED_IDS.ACTIVITY_DEVELOPMENT,
      SEED_IDS.ACTIVITY_TESTING,
    ]);
    expect(evmReportFixture.project.id).toBe(SEED_IDS.PROJECT);
  });
});
