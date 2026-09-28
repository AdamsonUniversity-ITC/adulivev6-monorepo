import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { AutoFetchConfig } from './types.ts';

const unwrapList = (response: unknown): AutoFetchConfig[] => {
  if (Array.isArray(response)) {
    return response as AutoFetchConfig[];
  }
  if (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    Array.isArray((response as { data?: unknown }).data)
  ) {
    return (response as { data: AutoFetchConfig[] }).data;
  }
  return [];
};

export const fetchAutoFetchConfigs = async (params?: {
  stage_id?: string | number;
  task_kind?: string;
}): Promise<AutoFetchConfig[]> => {
  const { data } = await registrarSvc.get(
    'v1/drs/workflow/auto-fetch-configs',
    { params },
  );
  return unwrapList(data);
};
