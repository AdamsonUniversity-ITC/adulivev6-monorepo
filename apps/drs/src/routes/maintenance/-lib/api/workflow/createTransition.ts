import { registrarSvc } from '@repo/axios-config/registrar-service';

export type CreateTransitionPayload = {
  to_stage_id: number | string;
  trigger_task_id?: number | string | null;
  label: string;
  outcome_key: string;
  is_active?: boolean;
  is_default?: boolean;
};

export const createWorkflowTransition = async (
  stageId: number | string,
  payload: CreateTransitionPayload,
) => {
  const { data } = await registrarSvc.post(
    `v1/drs/workflow/stages/${stageId}/transitions`,
    payload,
  );
  return data;
};
