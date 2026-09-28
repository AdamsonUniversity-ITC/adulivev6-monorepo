import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { AutoDisposalConfig } from './types.ts';

const unwrapList = (response: unknown): AutoDisposalConfig[] => {
  if (Array.isArray(response)) {
    return response as AutoDisposalConfig[];
  }
  if (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    Array.isArray((response as { data?: unknown }).data)
  ) {
    return (response as { data: AutoDisposalConfig[] }).data;
  }
  return [];
};

export const fetchAutoDisposalConfigs = async (params?: {
  stage_id?: string | number;
  task_kind?: string;
}): Promise<AutoDisposalConfig[]> => {
  const { data } = await registrarSvc.get(
    'v1/drs/workflow/auto-disposal-configs',
    { params },
  );
  return unwrapList(data);
};
