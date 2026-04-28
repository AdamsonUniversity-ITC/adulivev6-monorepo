import { useMemo } from 'react';

export interface UsePermissionReturn {
  permissions: string[];
  checkPermission: (permissionsParam: string[] | string) => boolean;
  hasTwoMatchingPermissions: (permissionsParam: string[]) => boolean;
}

/**
 * Returns true if any required permission is present in granted (monolith parity).
 */
export function checkPermission(
  granted: string[],
  permissionsParam: string[] | string,
): boolean {
  if (Array.isArray(permissionsParam)) {
    if (permissionsParam.length === 0) {
      return true;
    }
    return permissionsParam.some((p) => granted.includes(p));
  }
  if (permissionsParam.length === 0) {
    return true;
  }
  return granted.includes(permissionsParam);
}

/**
 * True when more than one entry from permissionsParam is present in granted (monolith parity).
 */
export function hasTwoMatchingPermissions(
  granted: string[],
  permissionsParam: string[],
): boolean {
  if (!Array.isArray(permissionsParam)) {
    throw new Error('`hasTwoMatchingPermissions` expects an array of strings.');
  }
  if (permissionsParam.length < 2) {
    throw new Error(
      'Please provide at least two permission strings to check against.',
    );
  }
  let matches = 0;
  for (const p of permissionsParam) {
    if (granted.includes(p)) {
      matches++;
    }
  }
  return matches > 1;
}

/**
 * Pass the current permission list from your MFE auth layer (session, zustand, react-query, etc.).
 */
export function usePermission(permissions: string[]): UsePermissionReturn {
  return useMemo(
    () => ({
      permissions,
      checkPermission: (permissionsParam: string[] | string) =>
        checkPermission(permissions, permissionsParam),
      hasTwoMatchingPermissions: (permissionsParam: string[]) =>
        hasTwoMatchingPermissions(permissions, permissionsParam),
    }),
    [permissions],
  );
}
