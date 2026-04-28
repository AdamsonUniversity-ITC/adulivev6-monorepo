import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { WorkflowTaskKind } from './types.ts';

export type UpdateTaskPayload = {
  name?: string;
  slug?: string;
  kind?: WorkflowTaskKind;
  is_required?: boolean;
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
