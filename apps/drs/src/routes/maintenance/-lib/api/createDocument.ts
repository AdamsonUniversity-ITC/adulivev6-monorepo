import { registrarSvc } from '@repo/axios-config/registrar-service';

export const createDocument = async (new_document, group_id) => {
  const response = await registrarSvc.post(
    `v1/drs/document-groups/${group_id}/create-document`,
    new_document,
  );
  return response?.data;
};
