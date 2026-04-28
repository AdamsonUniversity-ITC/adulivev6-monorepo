import { registrarSvc } from '@repo/axios-config/registrar-service';

export type DocumentListItem = {
  id: string | number;
  document_name: string;
  price: number;
  is_active: boolean;
  allow_multiple_per_request?: boolean;
};

export const fetchDocuments = async (
  selectedGroup: string | number,
): Promise<DocumentListItem[]> => {
  const { data } = await registrarSvc.get<
    { data?: DocumentListItem[] } | DocumentListItem[]
  >(`v1/drs/document-groups/${selectedGroup}/documents`);

  if (Array.isArray(data)) return data;
  return Array.isArray(data?.data) ? data.data : [];
};
