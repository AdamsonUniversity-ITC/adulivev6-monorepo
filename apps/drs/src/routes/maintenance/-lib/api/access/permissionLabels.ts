export const DRS_FOREIGNER_ONLY_PERMISSION = 'drs_foreigner_students_only';

const permissionLabels: Record<string, string> = {
  [DRS_FOREIGNER_ONLY_PERMISSION]: 'Only view foreigner students',
  drs_regular_user_access: 'DRS staff queue access',
  drs_user_management_view: 'View DRS user management',
  drs_user_management_manage: 'Manage DRS users',
  drs_workflow_assignment_manage: 'Manage DRS workflow assignments',
};

export const formatRolePermissionName = (permission: string): string =>
  permissionLabels[permission] ?? permission;
