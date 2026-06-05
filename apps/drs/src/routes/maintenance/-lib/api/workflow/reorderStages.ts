import { registrarSvc } from '@repo/axios-config/registrar-service';

export const reorderWorkflowStages = async (
  orderedIds: Array<number | string>,
) => {
  const { data } = await registrarSvc.post(
    'v1/drs/workflow/stages/reorder',
    { ordered_ids: orderedIds.map((id) => Number(id)) },
  );
  return data;
};
