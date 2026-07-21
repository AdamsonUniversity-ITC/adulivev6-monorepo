import { registrarSvc } from '@repo/axios-config/registrar-service';

export type CreateStagePayload = {
  name: string;
  slug?: string;
  is_initial?: boolean;
  is_terminal?: boolean;
  color?: string | null;
  transition_rule?: 'all_required_done' | 'any_done';
  restrict_assigned_users_to_course_programs?: boolean;
  allows_owner_cancellation?: boolean;
  notify_student_on_enter?: boolean;
};

export const createWorkflowStage = async (payload: CreateStagePayload) => {
  const { data } = await registrarSvc.post('v1/drs/workflow/stages', payload);
  return data;
};
