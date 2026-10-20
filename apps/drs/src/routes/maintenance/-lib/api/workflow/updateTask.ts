import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { WorkflowTaskKind } from './types.ts';

export type UpdateTaskPayload = {
  name?: string;
  slug?: string;
  kind?: WorkflowTaskKind;
  restrict_assigned_users_to_course_programs?: boolean | null;
  is_required?: boolean;
  allows_staff_receive_mode_change?: boolean;
  parallel_group?: string | null;
  drs_clearance_id?: number | string | null;
  drs_workflow_stage_id?: number | string;
  config_json?: Record<string, unknown> | null;
};

export const updateWorkflowTask = async (
  taskId: number | string,
  payload: UpdateTaskPayload,
) => {
  const { data } = await registrarSvc.patch(
    `v1/drs/workflow/tasks/${taskId}`,
    payload,
  );
  return data;
};
