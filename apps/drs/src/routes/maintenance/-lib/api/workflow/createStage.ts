import { registrarSvc } from '@repo/axios-config/registrar-service';

export type CreateStagePayload = {
  name: string;
  slug?: string;
  is_initial?: boolean;
  is_terminal?: boolean;
  color?: string | null;
  transition_rule?: 'all_required_done' | 'any_done';
};

export const createWorkflowStage = async (payload: CreateStagePayload) => {
  const { data } = await registrarSvc.post('v1/drs/workflow/stages', payload);
  return data;
};
