import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { WorkflowAssignment } from './types.ts';

export const fetchWorkflowAssignments = async (params?: {
  target_type?: string;
  target_key?: string | number;
  kind?: string;
  stage_id?: string | number;
  task_id?: string | number;
}): Promise<WorkflowAssignment[]> => {
  const { data } = await registrarSvc.get<{ data: WorkflowAssignment[] }>(
    'v1/drs/workflow/assignments',
    { params },
  );

  return data.data ?? [];
};
