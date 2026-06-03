import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { StageAccessPayload } from './types.ts';

export const fetchStageAccess = async (
  stageId: number | string,
): Promise<StageAccessPayload> => {
  const { data } = await registrarSvc.get<{ data: StageAccessPayload }>(
    `v1/drs/workflow/stages/${stageId}/access`,
  );
  return (
    data?.data ?? {
      users: [],
      roles: [],
    }
  );
};
