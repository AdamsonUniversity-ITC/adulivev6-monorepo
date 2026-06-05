import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { Role } from './types.ts';

export const fetchRoles = async (search?: string): Promise<Role[]> => {
  const { data } = await registrarSvc.get<{ data: Role[] }>(
    'v1/drs/workflow/roles',
    { params: search ? { q: search } : undefined },
  );
  return data?.data ?? [];
};
