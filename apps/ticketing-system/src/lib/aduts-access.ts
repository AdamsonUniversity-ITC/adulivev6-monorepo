import { checkPermission } from "@repo/hooks";

export const ADUTS_PERMISSIONS = {
  access: "ticketing-system-access",
  admin: "ticketing-system-admin-access",
  boardAdmin: "ticketing-system-board-admin-access",
} as const;

export function normalizePermissions(user: {
  permissions?: string[];
}): string[] {
  return Array.isArray(user.permissions) ? user.permissions : [];
}

export function isSuperAdmin(permissions: string[]): boolean {
  return checkPermission(permissions, ADUTS_PERMISSIONS.admin);
}

export function isBoardAdminCapability(permissions: string[]): boolean {
  return (
    isSuperAdmin(permissions) ||
    checkPermission(permissions, ADUTS_PERMISSIONS.boardAdmin)
  );
}
