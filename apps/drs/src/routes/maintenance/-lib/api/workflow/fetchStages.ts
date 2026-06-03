import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { WorkflowStage } from './types.ts';

const unwrap = (response: unknown): WorkflowStage[] => {
  if (Array.isArray(response)) {
    return response as WorkflowStage[];
  }
  if (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    Array.isArray((response as { data?: unknown }).data)
  ) {
    return (response as { data: WorkflowStage[] }).data;
  }
  return [];
};

export const fetchWorkflowStages = async (): Promise<WorkflowStage[]> => {
  const { data } = await registrarSvc.get('v1/drs/workflow/stages');
  return unwrap(data);
};
