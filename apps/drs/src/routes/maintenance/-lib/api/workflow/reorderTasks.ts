import { registrarSvc } from '@repo/axios-config/registrar-service';

export const reorderWorkflowTasks = async (
  stageId: number | string,
  orderedIds: Array<number | string>,
) => {
  const { data } = await registrarSvc.post(
    `v1/drs/workflow/stages/${stageId}/tasks/reorder`,
    { ordered_ids: orderedIds.map((id) => Number(id)) },
  );
  return data;
};
