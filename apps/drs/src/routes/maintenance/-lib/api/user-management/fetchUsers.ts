import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { UserManagementListResponse } from './types.ts';

export const fetchUserManagementUsers = async ({
  q,
  page,
  perPage,
}: {
  q?: string;
  page: number;
  perPage: number;
}): Promise<UserManagementListResponse> => {
  const { data } = await registrarSvc.get<UserManagementListResponse>(
    'v1/drs/user-management/users',
    {
      params: {
        q: q || undefined,
        page,
        per_page: perPage,
      },
    },
  );

  return data;
};
