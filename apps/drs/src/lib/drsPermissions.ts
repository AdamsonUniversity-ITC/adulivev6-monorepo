import { checkPermission } from '@repo/hooks';

/** Aligns with registrar DRSStudentAccessMiddleware + AccessService. */
export const DRS_STUDENT_APPLY_PERMISSION = 'college-access' as const;

/** Aligns with registrar DRSEmployeeAccessMiddleware. */
export const DRS_TEACHER_ACCESS_PERMISSION = 'teacher-access' as const;
export const DRS_REGULAR_USER_ACCESS_PERMISSION =
  'drs_regular_user_access' as const;

const SUBDOMAIN_TO_TENANT_ADMIN_ACCESS: Record<string, string> = {
  'college-drs': 'drs_college_maintenance_access',
  'shs-drs': 'drs_shs_maintenance_access',
  'bed-drs': 'drs_bed_maintenance_access',
};

const SUBDOMAIN_TO_MAINTENANCE = SUBDOMAIN_TO_TENANT_ADMIN_ACCESS;
const SUBDOMAIN_TO_ADMIN = SUBDOMAIN_TO_TENANT_ADMIN_ACCESS;

/**
 * First hostname label (e.g. college-drs from college-drs.localhost.test).
 */
export function getDrSubdomain(hostname: string): string {
  return hostname.split('.')[0] ?? '';
}

/**
 * Spatie permission required for DRS maintenance APIs for this host, or null if unknown tenant.
 */
export function getDrMaintenancePermissionForHost(
  hostname: string = typeof window !== 'undefined'
    ? window.location.hostname
    : '',
): string | null {
  const sub = getDrSubdomain(hostname);
  return SUBDOMAIN_TO_MAINTENANCE[sub] ?? null;
}

/**
 * Spatie permission required for DRS rollback/admin APIs for this host.
 */
export function getDrAdminPermissionForHost(
  hostname: string = typeof window !== 'undefined'
    ? window.location.hostname
    : '',
): string | null {
  const sub = getDrSubdomain(hostname);
  return SUBDOMAIN_TO_ADMIN[sub] ?? null;
}

export function hasDrAdminAccessForHost(
  permissions: string[],
  hostname: string = typeof window !== 'undefined'
    ? window.location.hostname
    : '',
): boolean {
  const admin = getDrAdminPermissionForHost(hostname);
  return admin !== null && checkPermission(permissions, admin);
}

/**
 * True when the user only has the student DRS portal permission for this host
 * (college-access) and not registrar maintenance. Staff queue is not part of
 * student access and should be hidden / blocked for this case.
 */
export function isStudentOnlyDrsPortalUser(
  permissions: string[],
  hostname: string = typeof window !== 'undefined'
    ? window.location.hostname
    : '',
): boolean {
  const hasCollege = checkPermission(permissions, DRS_STUDENT_APPLY_PERMISSION);
  const maintPerm = getDrMaintenancePermissionForHost(hostname);
  const hasMaint =
    maintPerm !== null && checkPermission(permissions, maintPerm);

  return hasCollege && !hasMaint;
}

export function hasDrsStaffQueuePermission(permissions: string[]): boolean {
  return (
    checkPermission(permissions, DRS_TEACHER_ACCESS_PERMISSION) ||
    checkPermission(permissions, DRS_REGULAR_USER_ACCESS_PERMISSION)
  );
}
