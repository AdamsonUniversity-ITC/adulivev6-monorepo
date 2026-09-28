import { registrarSvc } from '@repo/axios-config/registrar-service';

export async function deleteFlagDefinition(id: string): Promise<void> {
  await registrarSvc.delete(
    `v1/drs/employee/flag-definitions/${encodeURIComponent(id)}`,
  );
}
