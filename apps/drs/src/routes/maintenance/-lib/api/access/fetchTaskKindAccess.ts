import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { TaskKindAccessPayload } from './types.ts';

export const fetchTaskKindAccess = async (
  kind: string,
): Promise<TaskKindAccessPayload> => {
  const encoded = encodeURIComponent(kind);
  const { data } = await registrarSvc.get<{ data: TaskKindAccessPayload }>(
    `v1/drs/workflow/task-kinds/${encoded}/access`,
  );
  return (
    data?.data ?? {
      users: [],
      roles: [],
    }
  );
};
