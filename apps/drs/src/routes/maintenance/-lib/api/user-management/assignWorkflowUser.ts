import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { AssignmentPayload } from './types.ts';

export const assignWorkflowUser = async (
  payload: AssignmentPayload,
): Promise<unknown> => {
  const { data } = await registrarSvc.post<unknown>(
    'v1/drs/workflow/assignments',
    payload,
  );

  return data;
};
