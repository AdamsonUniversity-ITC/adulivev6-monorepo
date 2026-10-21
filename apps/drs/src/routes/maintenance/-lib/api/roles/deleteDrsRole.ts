import { registrarSvc } from '@repo/axios-config/registrar-service';

export const deleteDrsRole = async (roleId: string): Promise<void> => {
  await registrarSvc.delete(
    `v1/drs/user-management/roles/${encodeURIComponent(roleId)}`,
  );
};
