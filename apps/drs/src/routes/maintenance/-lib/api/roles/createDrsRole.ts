import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { DrsRole } from './types.ts';

export type CreateDrsRolePayload = {
  name: string;
  permissions?: string[];
};

export const createDrsRole = async (
  payload: CreateDrsRolePayload,
): Promise<DrsRole> => {
  const { data } = await registrarSvc.post<{ data: DrsRole }>(
    'v1/drs/user-management/roles',
    payload,
  );

  if (!data?.data) {
    throw new Error('Invalid role response');
  }

  return data.data;
};
