import { describe, expect, it } from 'vitest';

import { ROLES } from '@/api/types';
import { TEST_USERS } from '@/test/render';

import { hasPermission, PERMISSIONS } from './permissions';

const reviewer = TEST_USERS[ROLES.REVIEWER];
const registrar = TEST_USERS[ROLES.REGISTRAR];
const ownActivity = { owner: { id: registrar.id } };
const foreignActivity = { owner: { id: 'someone-else' } };

describe('permission matrix (ARQUITECTURA §11)', () => {
  it('denies everything to an anonymous visitor', () => {
    expect(hasPermission(null, PERMISSIONS.PROJECT_VIEW)).toBe(false);
    expect(hasPermission(null, PERMISSIONS.EVM_VIEW)).toBe(false);
  });

  it('lets both roles view projects, create activities and read the EVM report', () => {
    for (const user of [reviewer, registrar]) {
      expect(hasPermission(user, PERMISSIONS.PROJECT_VIEW)).toBe(true);
      expect(hasPermission(user, PERMISSIONS.ACTIVITY_CREATE)).toBe(true);
      expect(hasPermission(user, PERMISSIONS.EVM_VIEW)).toBe(true);
    }
  });

  it('reserves project management and user listing to REVIEWER', () => {
    const reviewerOnly = [
      PERMISSIONS.PROJECT_CREATE,
      PERMISSIONS.PROJECT_EDIT,
      PERMISSIONS.PROJECT_DELETE,
      PERMISSIONS.USERS_LIST,
    ];
    for (const permission of reviewerOnly) {
      expect(hasPermission(reviewer, permission)).toBe(true);
      expect(hasPermission(registrar, permission)).toBe(false);
    }
  });

  it('lets REGISTRAR edit and delete only their own activities', () => {
    expect(hasPermission(registrar, PERMISSIONS.ACTIVITY_EDIT, ownActivity)).toBe(true);
    expect(hasPermission(registrar, PERMISSIONS.ACTIVITY_DELETE, ownActivity)).toBe(true);
    expect(hasPermission(registrar, PERMISSIONS.ACTIVITY_EDIT, foreignActivity)).toBe(false);
    expect(hasPermission(registrar, PERMISSIONS.ACTIVITY_DELETE, foreignActivity)).toBe(false);
    expect(hasPermission(registrar, PERMISSIONS.ACTIVITY_EDIT)).toBe(false);
  });

  it('lets REVIEWER edit and delete any activity', () => {
    expect(hasPermission(reviewer, PERMISSIONS.ACTIVITY_EDIT, foreignActivity)).toBe(true);
    expect(hasPermission(reviewer, PERMISSIONS.ACTIVITY_DELETE, foreignActivity)).toBe(true);
  });
});
