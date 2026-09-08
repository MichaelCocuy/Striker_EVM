import { ROLES } from '@/api/types';

import type { UserSummary, Role, User } from '@/api/types';

/**
 * Permission matrix from docs/ARQUITECTURA.md §11.
 * The backend enforces the same rules (401/403); the UI uses them to hide disallowed actions.
 */
export const PERMISSIONS = {
  PROJECT_VIEW: 'project:view',
  PROJECT_CREATE: 'project:create',
  PROJECT_EDIT: 'project:edit',
  PROJECT_DELETE: 'project:delete',
  USERS_LIST: 'users:list',
  ACTIVITY_CREATE: 'activity:create',
  ACTIVITY_EDIT: 'activity:edit',
  ACTIVITY_DELETE: 'activity:delete',
  EVM_VIEW: 'evm:view',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Anything that carries an owner: a full Activity or a report row with `input.ownerId`. */
export interface OwnedResource {
  owner: Pick<UserSummary, 'id'>;
}

type PermissionRule = (user: User, subject?: OwnedResource) => boolean;

const alwaysAllowed: PermissionRule = () => true;

const reviewerOnly: PermissionRule = (user) => user.role === ROLES.REVIEWER;

const reviewerOrOwner: PermissionRule = (user, subject) =>
  user.role === ROLES.REVIEWER || (subject !== undefined && subject.owner.id === user.id);

const PERMISSION_RULES: Record<Permission, PermissionRule> = {
  [PERMISSIONS.PROJECT_VIEW]: alwaysAllowed,
  [PERMISSIONS.PROJECT_CREATE]: reviewerOnly,
  [PERMISSIONS.PROJECT_EDIT]: reviewerOnly,
  [PERMISSIONS.PROJECT_DELETE]: reviewerOnly,
  [PERMISSIONS.USERS_LIST]: reviewerOnly,
  [PERMISSIONS.ACTIVITY_CREATE]: alwaysAllowed,
  [PERMISSIONS.ACTIVITY_EDIT]: reviewerOrOwner,
  [PERMISSIONS.ACTIVITY_DELETE]: reviewerOrOwner,
  [PERMISSIONS.EVM_VIEW]: alwaysAllowed,
};

export function hasPermission(
  user: User | null,
  permission: Permission,
  subject?: OwnedResource,
): boolean {
  if (user === null) {
    return false;
  }
  return PERMISSION_RULES[permission](user, subject);
}

export function isRoleAllowed(role: Role, allowedRoles: readonly Role[]): boolean {
  return allowedRoles.includes(role);
}
