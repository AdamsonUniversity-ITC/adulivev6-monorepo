import { registrarSvc } from '@repo/axios-config/registrar-service';

export async function postNotifyStudent(
  applicationId: string,
  taskId: string,
  remarks?: string | null,
): Promise<void> {
  await registrarSvc.post(
    `v1/drs/applications/${applicationId}/tasks/${taskId}/notify-student`,
    { remarks: remarks ?? null },
  );
}
