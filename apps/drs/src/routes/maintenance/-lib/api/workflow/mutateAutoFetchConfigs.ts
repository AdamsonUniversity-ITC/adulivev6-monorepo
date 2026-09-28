import { registrarSvc } from '@repo/axios-config/registrar-service';
import type {
  AutoFetchAction,
  AutoFetchActionConfig,
  AutoFetchSource,
  AutoFetchTargetType,
  WorkflowTaskKind,
} from './types.ts';

export type AutoFetchPayload = {
  name: string;
  target_type: AutoFetchTargetType;
  drs_workflow_stage_id?: string | number | null;
  task_kind?: WorkflowTaskKind | null;
  source: AutoFetchSource;
  action: AutoFetchAction;
  action_config_json: AutoFetchActionConfig;
  run_at_time: string;
  is_enabled?: boolean;
};

export const createAutoFetchConfig = async (payload: AutoFetchPayload) => {
  const { data } = await registrarSvc.post(
    'v1/drs/workflow/auto-fetch-configs',
    payload,
  );
  return data;
};

export const updateAutoFetchConfig = async (
  configId: string | number,
  payload: Partial<AutoFetchPayload>,
) => {
  const { data } = await registrarSvc.patch(
    `v1/drs/workflow/auto-fetch-configs/${configId}`,
    payload,
  );
  return data;
};

export const deleteAutoFetchConfig = async (configId: string | number) => {
  await registrarSvc.delete(`v1/drs/workflow/auto-fetch-configs/${configId}`);
};
