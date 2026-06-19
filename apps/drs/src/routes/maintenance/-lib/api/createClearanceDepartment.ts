import { registrarSvc } from '@repo/axios-config/registrar-service';

type CreateClearanceDepartmentPayload = {
  name: string;
  description: string;
  restrict_assigned_users_to_course_programs?: boolean;
};

export const createClearanceDepartment = async (
  payload: CreateClearanceDepartmentPayload,
) => {
  const response = await registrarSvc.post(
    `v1/drs/clearance-departments/create-clearance-department`,
    payload,
  );

  return response?.data;
};
