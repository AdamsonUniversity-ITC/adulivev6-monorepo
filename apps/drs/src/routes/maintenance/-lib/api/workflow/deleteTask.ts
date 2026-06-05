import { registrarSvc } from '@repo/axios-config/registrar-service';

export const deleteWorkflowTask = async (taskId: number | string) => {
  const { data } = await registrarSvc.delete(
    `v1/drs/workflow/tasks/${taskId}`,
  );
  return data;
};
