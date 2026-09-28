import { registrarSvc } from '@repo/axios-config/registrar-service';
import type {
  AutoDisposalTargetType,
  WorkflowTaskKind,
} from './types.ts';

export type AutoDisposalPayload = {
  name: string;
  target_type: AutoDisposalTargetType;
  drs_workflow_stage_id?: string | number | null;
  task_kind?: WorkflowTaskKind | null;
  dispose_after_working_days: number;
  notify_before_working_days: number;
  subject?: string;
  body_html?: string;
  is_enabled?: boolean;
};

export const createAutoDisposalConfig = async (
  payload: AutoDisposalPayload,
) => {
  const { data } = await registrarSvc.post(
    'v1/drs/workflow/auto-disposal-configs',
    payload,
  );
  return data;
};

export const updateAutoDisposalConfig = async (
  configId: string | number,
  payload: Partial<AutoDisposalPayload>,
) => {
  const { data } = await registrarSvc.patch(
    `v1/drs/workflow/auto-disposal-configs/${configId}`,
    payload,
  );
  return data;
};

export const deleteAutoDisposalConfig = async (
  configId: string | number,
) => {
  await registrarSvc.delete(
    `v1/drs/workflow/auto-disposal-configs/${configId}`,
  );
};
