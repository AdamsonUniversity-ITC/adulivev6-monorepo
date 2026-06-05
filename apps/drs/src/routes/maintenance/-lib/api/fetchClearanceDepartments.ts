import { registrarSvc } from '@repo/axios-config/registrar-service';

export const fetchClearanceDepartments = async () => {
  const { data } = await registrarSvc.get(`v1/drs/clearance-departments`);
  return data;
};
