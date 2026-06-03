import { registrarSvc } from '@repo/axios-config/registrar-service';

export type CreateDocumentPayload = {
  document_name: string;
  price: number;
  is_active: boolean;
  allow_multiple_per_request: boolean;
};

export const createDocument = async (
  payload: CreateDocumentPayload,
  groupId: string | number,
) => {
  const response = await registrarSvc.post(
    `v1/drs/document-groups/${groupId}/create-document`,
    payload,
  );
  return response?.data;
};
