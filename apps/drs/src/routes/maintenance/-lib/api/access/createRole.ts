import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { Role } from './types.ts';

export type CreateRolePayload = {
  name: string;
  permissions?: string[];
  guard_name?: string;
};

export const createRole = async (payload: CreateRolePayload): Promise<Role> => {
  const { data } = await registrarSvc.post<{ data: Role }>(
    'v1/drs/workflow/roles',
    payload,
  );
  return data.data;
};
