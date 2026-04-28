import { registrarSvc } from '@repo/axios-config/registrar-service';

export const detachClearanceDepartmentUser = async (
  departmentId: number | string,
  userId: number | string,
) => {
  await registrarSvc.delete(
    `v1/drs/clearance-departments/${departmentId}/users/${userId}`,
  );
};
