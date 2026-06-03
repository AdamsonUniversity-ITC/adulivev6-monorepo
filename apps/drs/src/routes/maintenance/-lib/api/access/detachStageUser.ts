import { registrarSvc } from '@repo/axios-config/registrar-service';

export const detachStageUser = async (
  stageId: number | string,
  empNo: string,
): Promise<void> => {
  await registrarSvc.delete(
    `v1/drs/workflow/stages/${stageId}/access/users/${empNo}`,
  );
};
