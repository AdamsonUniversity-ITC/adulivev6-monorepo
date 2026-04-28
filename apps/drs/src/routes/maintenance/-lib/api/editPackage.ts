import { registrarSvc } from '@repo/axios-config/registrar-service';

export const editPackage = async (packageId: string, drsPackage) => {
  const response = await registrarSvc.patch(
    `v1/drs/packages/${packageId}`,
    drsPackage,
  );
  return response?.data;
};
