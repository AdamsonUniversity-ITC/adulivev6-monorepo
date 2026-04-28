import { registrarSvc } from '@repo/axios-config/registrar-service';

export type DocumentGroup = {
  id: string | number;
  group_name: string;
};

export const fetchDocumentGroups = async (): Promise<DocumentGroup[]> => {
  const { data } = await registrarSvc.get<{ data?: DocumentGroup[] } | DocumentGroup[]>(
    `v1/drs/document-groups`,
  );

  if (Array.isArray(data)) return data;
  return Array.isArray(data?.data) ? data.data : [];
};
