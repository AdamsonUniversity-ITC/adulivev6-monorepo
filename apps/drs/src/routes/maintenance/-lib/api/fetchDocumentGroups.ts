import { registrarSvc } from '@repo/axios-config/registrar-service';

export const fetchDocumentGroups = async (access: string[]) => {
  const { data } = await registrarSvc.get(`v1/drs/document-groups`);
  return data;
};
