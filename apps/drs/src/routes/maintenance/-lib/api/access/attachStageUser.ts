import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { StageUserAccess } from './types.ts';

export type AttachStageUserPayload = {
  emp_no: string;
  role_label?: string | null;
};

export const attachStageUser = async (
  stageId: number | string,
  payload: AttachStageUserPayload,
): Promise<StageUserAccess> => {
  const { data } = await registrarSvc.post<{ data: StageUserAccess }>(
    `v1/drs/workflow/stages/${stageId}/access/users`,
    payload,
  );
  return data.data;
};
