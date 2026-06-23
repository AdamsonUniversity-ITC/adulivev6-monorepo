import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { TaskKindUserAccess } from './types.ts';

export type AttachTaskKindUserPayload = {
  emp_no: string;
  role_label?: string | null;
};

export const attachTaskKindUser = async (
  kind: string,
  payload: AttachTaskKindUserPayload,
): Promise<TaskKindUserAccess> => {
  const encoded = encodeURIComponent(kind);
  const { data } = await registrarSvc.post<{ data: TaskKindUserAccess }>(
    `v1/drs/workflow/task-kinds/${encoded}/access/users`,
    payload,
  );
  return data.data;
};
