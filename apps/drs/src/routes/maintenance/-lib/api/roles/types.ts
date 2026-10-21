export type DrsRolePermission = {
  id: string;
  name: string;
  guard_name: string;
};

export type DrsRole = {
  id: string;
  name: string;
  guard_name: string;
  permissions: DrsRolePermission[];
};

export const isDrsRoleName = (name: string): boolean => {
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  return (
    trimmed.startsWith('DRS ') ||
    lower.startsWith('drs-') ||
    lower.startsWith('drs ')
  );
};
