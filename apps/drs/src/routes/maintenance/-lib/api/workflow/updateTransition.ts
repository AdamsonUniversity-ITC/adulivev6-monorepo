import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { CreateTransitionPayload } from './createTransition.ts';

export type UpdateTransitionPayload = Partial<CreateTransitionPayload>;

export const updateWorkflowTransition = async (
  transitionId: number | string,
  payload: UpdateTransitionPayload,
) => {
  const { data } = await registrarSvc.patch(
    `v1/drs/workflow/transitions/${transitionId}`,
    payload,
  );
  return data;
};
