import { useCallback } from 'react';

import { hasPermission } from './permissions';
import { useAuth } from './useAuth';

import type { OwnedResource, Permission } from './permissions';

export type CanFunction = (permission: Permission, subject?: OwnedResource) => boolean;

/**
 * `can('project:create')` or `can('activity:edit', activity)`; evaluates the §11 matrix
 * against the signed-in user. Returns false when nobody is signed in.
 */
export function useCan(): CanFunction {
  const { user } = useAuth();
  return useCallback<CanFunction>(
    (permission, subject) => hasPermission(user, permission, subject),
    [user],
  );
}
