import { registrarSvc } from '@repo/axios-config/registrar-service';

export const fetchPackage = async (packageId: string) => {
  const { data } = await registrarSvc.get(`v1/drs/packages/${packageId}`, {
    params: {
      with: 'rules.rule',
    },
  });
  return data;
};
