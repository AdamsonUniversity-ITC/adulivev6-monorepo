import { registrarSvc } from '@repo/axios-config/registrar-service';

type AttachPayload = {
  emp_no: string;
  role?: string;
};

export const attachClearanceDepartmentUser = async (
  departmentId: number | string,
  payload: AttachPayload,
) => {
  await registrarSvc.post(
    `v1/drs/clearance-departments/${departmentId}/users`,
    payload,
  );
};
