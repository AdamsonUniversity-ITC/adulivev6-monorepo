import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { WorkflowTaskKind } from './types.ts';

export type CreateTaskPayload = {
  name: string;
  slug?: string;
  kind: WorkflowTaskKind;
  is_required?: boolean;
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
