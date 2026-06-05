import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { Role } from './types.ts';

export const updateRolePermissions = async (
  roleId: number | string,
  permissions: string[],
): Promise<Role> => {
  const { data } = await registrarSvc.put<{ data: Role }>(
    `v1/drs/workflow/roles/${roleId}/permissions`,
    { permissions },
  );
  return data.data;
};
