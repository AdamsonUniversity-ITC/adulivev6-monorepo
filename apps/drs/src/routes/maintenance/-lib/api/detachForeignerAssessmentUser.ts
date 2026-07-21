import { registrarSvc } from '@repo/axios-config/registrar-service';

export const detachForeignerAssessmentUser = async (empNo: string) => {
  await registrarSvc.delete(
    `v1/drs/assessment-settings/foreigner-users/${encodeURIComponent(empNo)}`,
  );
};
