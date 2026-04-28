import { registrarSvc } from '@repo/axios-config/registrar-service';

export type ClearanceDepartmentUserSearchHit = {
  id: number;
  name: string | null;
  email: string | null;
};

export const searchClearanceDepartmentUsers = async (
  q: string,
): Promise<ClearanceDepartmentUserSearchHit[]> => {
  const { data } = await registrarSvc.get<{
    data?: ClearanceDepartmentUserSearchHit[];
  }>(`v1/drs/clearance-departments/user-search`, { params: { q } });

  return Array.isArray(data?.data) ? data.data : [];
};
