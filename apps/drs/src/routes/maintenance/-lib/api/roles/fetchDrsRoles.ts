import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { DrsRole } from './types.ts';

export const fetchDrsRoles = async (search?: string): Promise<DrsRole[]> => {
  const { data } = await registrarSvc.get<{ data: DrsRole[] }>(
    'v1/drs/user-management/roles',
    { params: search ? { q: search } : undefined },
  );

  return data?.data ?? [];
};
