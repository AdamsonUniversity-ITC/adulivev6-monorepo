import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { WorkflowTaskKind } from './types.ts';

export type CreateTaskPayload = {
  name: string;
  slug?: string;
  kind: WorkflowTaskKind;
  restrict_assigned_users_to_course_programs?: boolean | null;
  is_required?: boolean;
  allows_staff_receive_mode_change?: boolean;
  parallel_group?: string | null;
  drs_clearance_id?: number | string | null;
  config_json?: Record<string, unknown> | null;
};

export const createWorkflowTask = async (
  stageId: number | string,
  payload: CreateTaskPayload,
) => {
  const { data } = await registrarSvc.post(
    `v1/drs/workflow/stages/${stageId}/tasks`,
    payload,
  );
  return data;
};
