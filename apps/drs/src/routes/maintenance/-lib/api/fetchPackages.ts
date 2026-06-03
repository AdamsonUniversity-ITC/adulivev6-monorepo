import { registrarSvc } from '@repo/axios-config/registrar-service';

export type PackageListItem = {
  id: string | number;
  package_name: string;
  price: number;
  is_active: boolean;
  allow_multiple_per_request?: boolean;
};

export const fetchPackages = async (
  selectedGroup: string | number,
): Promise<PackageListItem[]> => {
  const { data } = await registrarSvc.get<
    { data?: PackageListItem[] } | PackageListItem[]
  >(`v1/drs/document-groups/${selectedGroup}/packages`);

  if (Array.isArray(data)) return data;
  return Array.isArray(data?.data) ? data.data : [];
};
