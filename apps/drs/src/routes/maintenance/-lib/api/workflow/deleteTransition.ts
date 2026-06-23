import { registrarSvc } from '@repo/axios-config/registrar-service';

export const deleteWorkflowTransition = async (
  transitionId: number | string,
) => {
  await registrarSvc.delete(`v1/drs/workflow/transitions/${transitionId}`);
};
