import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { UserManagementProfile } from './types.ts';

export async function putUserManagementRoles(
  empNo: string,
  roles: string[],
): Promise<UserManagementProfile> {
  const { data: body } = await registrarSvc.put<unknown>(
    `v1/drs/user-management/users/${encodeURIComponent(empNo)}/roles`,
    { roles },
  );

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Invalid user management profile response');
  }

  return (body as { data: UserManagementProfile }).data;
}
