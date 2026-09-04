import { registrarSvc } from '@repo/axios-config/registrar-service';

export type UpdateDocumentGroupPayload = {
  group_name: string;
};

export const updateDocumentGroup = async (
  groupId: string | number,
  payload: UpdateDocumentGroupPayload,
) => {
  const response = await registrarSvc.patch(
    `v1/drs/document-groups/${groupId}`,
    payload,
  );

  return response?.data;
};
