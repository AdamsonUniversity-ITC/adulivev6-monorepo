import { registrarSvc } from '@repo/axios-config/registrar-service';

export const deleteDocument = async (
  documentId: string | number,
): Promise<void> => {
  await registrarSvc.delete(`v1/drs/documents/${documentId}`);
};
