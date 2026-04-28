import type { Employee } from '../employees/types.ts';

export type StageUserAccess = {
  id: string;
  stage_id: string;
  emp_no: string;
  role_label: string | null;
  employee?: Employee | null;
  created_at?: string;
};

export type StageRoleAccess = {
  id: string;
  stage_id: string;
  role_name: string;
  created_at?: string;
};

export type StageAccessPayload = {
  users: StageUserAccess[];
  roles: StageRoleAccess[];
};

export type RolePermission = {
  id: string;
  name: string;
  guard_name: string;
};

export type Role = {
  id: string;
  name: string;
  guard_name: string;
  permissions: RolePermission[];
};
