import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { DrsRole } from './types.ts';

export const updateDrsRolePermissions = async (
  roleId: string,
  permissions: string[],
): Promise<DrsRole> => {
  const { data } = await registrarSvc.put<{ data: DrsRole }>(
    `v1/drs/user-management/roles/${encodeURIComponent(roleId)}/permissions`,
    { permissions },
  );

  if (!data?.data) {
    throw new Error('Invalid role response');
  }

  return data.data;
};
