import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { DrsRolePermission } from './types.ts';

export const fetchDrsPermissions = async (
  search?: string,
): Promise<DrsRolePermission[]> => {
  const { data } = await registrarSvc.get<{ data: DrsRolePermission[] }>(
    'v1/drs/user-management/permissions',
    { params: search ? { q: search } : undefined },
  );

  return data?.data ?? [];
};
