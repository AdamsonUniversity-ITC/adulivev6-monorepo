import { registrarSvc } from '@repo/axios-config/registrar-service';

export const fetchDocuments = async (
  access: string[],
  selectedGroup: string,
) => {
  const { data } = await registrarSvc.get(
    `v1/drs/document-groups/${selectedGroup}/documents`,
  );
  return data;
};
