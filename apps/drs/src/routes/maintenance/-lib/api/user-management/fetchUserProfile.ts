import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { UserManagementProfile } from './types.ts';

export const fetchUserManagementProfile = async (
  empNo: string,
): Promise<UserManagementProfile> => {
  const { data } = await registrarSvc.get<{ data: UserManagementProfile }>(
    `v1/drs/user-management/users/${encodeURIComponent(empNo)}`,
  );

  return data.data;
};
