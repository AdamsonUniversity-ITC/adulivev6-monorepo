import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { WorkflowKind } from './types.ts';

export const fetchWorkflowTaskKinds = async (): Promise<WorkflowKind[]> => {
  const { data } = await registrarSvc.get('v1/drs/workflow/task-kinds');
  if (data && typeof data === 'object' && Array.isArray(data.data)) {
    return data.data as WorkflowKind[];
  }
  return [];
};
