import { registrarSvc } from '@repo/axios-config/registrar-service';

export const deletePackage = async (
  packageId: string | number,
): Promise<void> => {
  await registrarSvc.delete(`v1/drs/packages/${packageId}`);
};
