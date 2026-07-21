export const DRS_FOREIGNER_ONLY_PERMISSION = 'drs_foreigner_students_only';
export const DRS_CANCEL_APPLICATIONS_PERMISSION = 'drs_cancel_applications';
export const DRS_ADMIN_ACCESS_PERMISSION = 'drs_admin_access';
export const DRS_USER_MANAGEMENT_MANAGE_PERMISSION =
  'drs_user_management_manage';

const permissionLabels: Record<string, string> = {
  [DRS_FOREIGNER_ONLY_PERMISSION]: 'Only view foreigner students',
  [DRS_CANCEL_APPLICATIONS_PERMISSION]: 'Cancel DRS applications',
  [DRS_ADMIN_ACCESS_PERMISSION]: 'DRS admin access',
  drs_regular_user_access: 'DRS staff queue access',
  drs_user_management_view: 'View DRS user management',
  drs_user_management_manage: 'Manage DRS users',
  drs_workflow_assignment_manage: 'Manage DRS workflow assignments',
};

export const formatRolePermissionName = (permission: string): string =>
  permissionLabels[permission] ?? permission;
