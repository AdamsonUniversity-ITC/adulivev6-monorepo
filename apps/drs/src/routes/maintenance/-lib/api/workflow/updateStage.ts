import { registrarSvc } from '@repo/axios-config/registrar-service';

export type UpdateStagePayload = {
  name?: string;
  slug?: string;
  is_initial?: boolean;
  is_terminal?: boolean;
  color?: string | null;
  transition_rule?: 'all_required_done' | 'any_done';
};

export const updateWorkflowStage = async (
  stageId: number | string,
  payload: UpdateStagePayload,
) => {
  const { data } = await registrarSvc.patch(
    `v1/drs/workflow/stages/${stageId}`,
    payload,
  );
  return data;
};
