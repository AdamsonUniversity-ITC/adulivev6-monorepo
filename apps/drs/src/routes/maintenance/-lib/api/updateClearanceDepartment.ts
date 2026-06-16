import { registrarSvc } from '@repo/axios-config/registrar-service';

type UpdateClearanceDepartmentPayload = {
  name?: string;
  description?: string;
  restrict_assigned_users_to_course_programs?: boolean;
};

export const updateClearanceDepartment = async (
  departmentId: number | string,
  payload: UpdateClearanceDepartmentPayload,
) => {
  const response = await registrarSvc.patch(
    `v1/drs/clearance-departments/${departmentId}`,
    payload,
  );

  return response?.data;
};
