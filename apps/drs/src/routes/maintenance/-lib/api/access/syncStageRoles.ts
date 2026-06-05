import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { StageRoleAccess } from './types.ts';

export const syncStageRoles = async (
  stageId: number | string,
  roleNames: string[],
): Promise<StageRoleAccess[]> => {
  const { data } = await registrarSvc.put<{ data: StageRoleAccess[] }>(
    `v1/drs/workflow/stages/${stageId}/access/roles`,
    { role_names: roleNames },
  );
  return data?.data ?? [];
};
