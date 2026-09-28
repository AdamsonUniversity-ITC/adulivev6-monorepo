import { checkPermission } from '@repo/hooks';

/** Aligns with registrar DRSStudentAccessMiddleware + AccessService. */
export const DRS_STUDENT_APPLY_PERMISSION = 'college-access' as const;

/** Aligns with registrar DRSEmployeeAccessMiddleware. */
export const DRS_TEACHER_ACCESS_PERMISSION = 'teacher-access' as const;
export const DRS_REGULAR_USER_ACCESS_PERMISSION =
  'drs_regular_user_access' as const;

/** Super Admin of all DRS (Users Center `drs_admin_access`). */
export const DRS_SUPER_ADMIN_PERMISSION = 'drs_admin_access' as const;

const SUBDOMAIN_TO_MAINTENANCE: Record<string, string> = {
  'college-drs': 'drs_college_maintenance_access',
  'shs-drs': 'drs_shs_maintenance_access',
  'bed-drs': 'drs_bed_maintenance_access',
};

/** Bare dev hosts map to college tenant so `pnpm dev` on 127.0.0.1 still resolves permissions. */
const DEV_LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost']);
const DEV_DEFAULT_TENANT = 'college-drs';

/**
 * First hostname label (e.g. college-drs from college-drs.localhost.test).
 * In dev, 127.0.0.1 / localhost default to college-drs for maintenance permission checks.
 */
export function getDrSubdomain(hostname: string): string {
  const normalized = hostname.toLowerCase();
  if (import.meta.env.DEV && DEV_LOCAL_HOSTS.has(normalized)) {
    return DEV_DEFAULT_TENANT;
  }
  return normalized.split('.')[0] ?? '';
}

/**
 * Spatie permission required for DRS subdomain business Administrator for this host.
 */
export function getDrMaintenancePermissionForHost(
  hostname: string = typeof window !== 'undefined'
    ? window.location.hostname
    : '',
): string | null {
  const sub = getDrSubdomain(hostname);
  return SUBDOMAIN_TO_MAINTENANCE[sub] ?? null;
}

/** @deprecated Use {@link DRS_SUPER_ADMIN_PERMISSION} / {@link hasDrsSuperAdminAccess}. */
export function getDrAdminPermissionForHost(
  _hostname: string = typeof window !== 'undefined'
    ? window.location.hostname
    : '',
): string {
  return DRS_SUPER_ADMIN_PERMISSION;
}

export function hasDrsSuperAdminAccess(permissions: string[]): boolean {
  return checkPermission(permissions, DRS_SUPER_ADMIN_PERMISSION);
}

export function hasDrMaintenanceAccessForHost(
  permissions: string[],
  hostname: string = typeof window !== 'undefined'
    ? window.location.hostname
    : '',
): boolean {
  const maint = getDrMaintenancePermissionForHost(hostname);
  return maint !== null && checkPermission(permissions, maint);
}

/**
 * Business CMS entry: subdomain Administrator or Super Admin.
 */
export function hasDrCmsAccessForHost(
  permissions: string[],
  hostname: string = typeof window !== 'undefined'
    ? window.location.hostname
    : '',
): boolean {
  return (
    hasDrsSuperAdminAccess(permissions) ||
    hasDrMaintenanceAccessForHost(permissions, hostname)
  );
}

/**
 * Super Admin (`drs_admin_access`) — restore / platform tools.
 * Prefer {@link hasDrsSuperAdminAccess} for new code.
 */
export function hasDrAdminAccessForHost(
  permissions: string[],
  _hostname: string = typeof window !== 'undefined'
    ? window.location.hostname
    : '',
): boolean {
  return hasDrsSuperAdminAccess(permissions);
}

/**
 * True when the user only has the student DRS portal permission for this host
 * (college-access) and not registrar CMS. Staff queue is not part of
 * student access and should be hidden / blocked for this case.
 */
export function isStudentOnlyDrsPortalUser(
  permissions: string[],
  hostname: string = typeof window !== 'undefined'
    ? window.location.hostname
    : '',
): boolean {
  const hasCollege = checkPermission(permissions, DRS_STUDENT_APPLY_PERMISSION);
  return hasCollege && !hasDrCmsAccessForHost(permissions, hostname);
}

export function hasDrsStaffQueuePermission(permissions: string[]): boolean {
  return (
    checkPermission(permissions, DRS_TEACHER_ACCESS_PERMISSION) ||
    checkPermission(permissions, DRS_REGULAR_USER_ACCESS_PERMISSION)
  );
}
