import { registrarSvc } from '@repo/axios-config/registrar-service';

export type PackageRule = {
  rule: {
    rule_name: string;
    rule_type: string;
  };
};

export type PackageDetail = {
  id: string | number;
  group_id?: string | number | null;
  package_name: string;
  price: number;
  account_code?: string;
  is_active: boolean;
  allow_multiple_per_request: boolean;
  once_per_student?: boolean;
  rules?: PackageRule[];
  included_items?: Array<{
    id: number | string;
    label: string;
    sort_order?: number;
  }>;
};

export const fetchPackage = async (
  packageId: string | number,
): Promise<PackageDetail> => {
  const { data } = await registrarSvc.get<PackageDetail>(
    `v1/drs/packages/${packageId}`,
    { params: { with: 'rules.rule,includedItems' } },
  );
  return data;
};
