import { registrarSvc } from '@repo/axios-config/registrar-service';

export const deleteWorkflowStage = async (stageId: number | string) => {
  const { data } = await registrarSvc.delete(
    `v1/drs/workflow/stages/${stageId}`,
  );
  return data;
};
