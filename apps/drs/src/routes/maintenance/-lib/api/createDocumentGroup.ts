import { registrarSvc } from '@repo/axios-config/registrar-service';

export type CreateDocumentGroupPayload = {
  group_name: string;
};

export const createDocumentGroup = async (
  payload: CreateDocumentGroupPayload,
) => {
  const response = await registrarSvc.post(
    `v1/drs/document-groups/create-document-group`,
    payload,
  );
  return response?.data;
};
