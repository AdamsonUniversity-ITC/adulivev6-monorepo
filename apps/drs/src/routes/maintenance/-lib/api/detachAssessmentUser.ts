import { registrarSvc } from '@repo/axios-config/registrar-service';

export const detachAssessmentUser = async (empNo: string) => {
  await registrarSvc.delete(`v1/drs/assessment-settings/users/${empNo}`);
};
