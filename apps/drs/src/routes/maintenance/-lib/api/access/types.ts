import type { Employee } from '../employees/types.ts';

export type TaskKindUserAccess = {
  id: string;
  kind: string;
  emp_no: string;
  role_label: string | null;
  employee?: Employee | null;
  created_at?: string;
};

export type TaskKindRoleAccess = {
  id: string;
  kind: string;
  role_name: string;
  created_at?: string;
};

export type TaskKindAccessPayload = {
  users: TaskKindUserAccess[];
  roles: TaskKindRoleAccess[];
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
