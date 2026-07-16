import { registrarSvc } from '@repo/axios-config/registrar-service';

export const detachTaskKindUser = async (
  kind: string,
  empNo: string,
): Promise<void> => {
  const encoded = encodeURIComponent(kind);
  await registrarSvc.delete(
    `v1/drs/workflow/task-kinds/${encoded}/access/users/${empNo}`,
  );
};
