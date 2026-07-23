import { registrarSvc } from '@repo/axios-config/registrar-service';

export const deleteDocumentGroup = async (
  groupId: string | number,
): Promise<void> => {
  await registrarSvc.delete(`v1/drs/document-groups/${groupId}`);
};
