import { registrarSvc } from '@repo/axios-config/registrar-service';

export const createDocumentGroup = async (newDocumentGroup, access) => {
  const response = await registrarSvc.post(
    `v1/drs/document-groups/create-document-group`,
    newDocumentGroup,
  );
  return response?.data;
};
