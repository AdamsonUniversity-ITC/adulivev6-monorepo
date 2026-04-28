import { registrarSvc } from '@repo/axios-config/registrar-service';

type AttachPayload = {
  emp_no: string;
  role?: string;
};

export const attachAssessmentUser = async (payload: AttachPayload) => {
  await registrarSvc.post(`v1/drs/assessment-settings/users`, payload);
};
