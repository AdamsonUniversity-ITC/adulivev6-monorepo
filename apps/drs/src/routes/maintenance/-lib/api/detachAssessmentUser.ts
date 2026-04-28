import { registrarSvc } from '@repo/axios-config/registrar-service';

export const detachAssessmentUser = async (userId: number | string) => {
  await registrarSvc.delete(`v1/drs/assessment-settings/users/${userId}`);
};
