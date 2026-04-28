import { registrarSvc } from '@repo/axios-config/registrar-service';

export type EditPackagePayload = {
  package_name: string;
  price: number;
  is_active: boolean;
  allow_multiple_per_request: boolean;
  package_rules?: {
    graduate?: boolean;
    undergraduate?: boolean;
    enrolled?: boolean;
    unenrolled?: boolean;
  };
};

export const editPackage = async (
  packageId: string | number,
  payload: EditPackagePayload,
) => {
  const response = await registrarSvc.patch(
    `v1/drs/packages/${packageId}`,
    payload,
  );
  return response?.data;
};
