import { registrarSvc } from '@repo/axios-config/registrar-service';

export const deleteClearanceDepartment = async (
  departmentId: number | string,
) => {
  const response = await registrarSvc.delete(
    `v1/drs/clearance-departments/${departmentId}`,
  );

  return response?.data;
};
