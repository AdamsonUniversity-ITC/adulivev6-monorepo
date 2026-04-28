import { registrarSvc } from '@repo/axios-config/registrar-service';

export const editDocument = async (documentId: string, document) => {
  const response = await registrarSvc.patch(
    `v1/drs/documents/${documentId}`,
    document,
  );
  return response?.data;
};
