import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { UserManagementProfile } from './types.ts';

export type PatchUserManagementPermissionsPayload = {
  permissions: {
    drs_cancel_applications: boolean;
  };
};

export async function patchUserManagementPermissions(
  empNo: string,
  payload: PatchUserManagementPermissionsPayload,
): Promise<UserManagementProfile> {
  const { data: body } = await registrarSvc.patch<unknown>(
    `v1/drs/user-management/users/${encodeURIComponent(empNo)}/permissions`,
    payload,
  );

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Invalid user management profile response');
  }

  return (body as { data: UserManagementProfile }).data;
}
