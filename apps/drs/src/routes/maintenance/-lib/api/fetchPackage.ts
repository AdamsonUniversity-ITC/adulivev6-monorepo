import { registrarSvc } from '@repo/axios-config/registrar-service';

export type PackageRule = {
  rule: {
    rule_name: string;
    rule_type: string;
  };
};

export type PackageDetail = {
  id: string | number;
  package_name: string;
  price: number;
  is_active: boolean;
  allow_multiple_per_request: boolean;
  rules?: PackageRule[];
};

export const fetchPackage = async (
  packageId: string | number,
): Promise<PackageDetail> => {
  const { data } = await registrarSvc.get<PackageDetail>(
    `v1/drs/packages/${packageId}`,
    { params: { with: 'rules.rule' } },
  );
  return data;
};
