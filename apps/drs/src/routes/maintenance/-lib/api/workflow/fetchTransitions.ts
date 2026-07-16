import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { WorkflowTransition } from './types.ts';

const unwrap = (response: unknown): WorkflowTransition[] => {
  if (Array.isArray(response)) return response as WorkflowTransition[];
  if (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    Array.isArray((response as { data?: unknown }).data)
  ) {
    return (response as { data: WorkflowTransition[] }).data;
  }
  return [];
};

export const fetchWorkflowTransitions = async (): Promise<
  WorkflowTransition[]
> => {
  const { data } = await registrarSvc.get('v1/drs/workflow/transitions');
  return unwrap(data);
};
