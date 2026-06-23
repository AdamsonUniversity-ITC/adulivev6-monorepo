import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { TaskKindRoleAccess } from './types.ts';

export const syncTaskKindRoles = async (
  kind: string,
  roleNames: string[],
): Promise<TaskKindRoleAccess[]> => {
  const encoded = encodeURIComponent(kind);
  const { data } = await registrarSvc.put<{ data: TaskKindRoleAccess[] }>(
    `v1/drs/workflow/task-kinds/${encoded}/access/roles`,
    { role_names: roleNames },
  );
  return data?.data ?? [];
};
