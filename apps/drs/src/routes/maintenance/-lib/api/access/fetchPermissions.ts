import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { RolePermission } from './types.ts';

export const fetchPermissions = async (
  search?: string,
): Promise<RolePermission[]> => {
  const { data } = await registrarSvc.get<{ data: RolePermission[] }>(
    'v1/drs/workflow/permissions',
    { params: search ? { q: search } : undefined },
  );
  return data?.data ?? [];
};
