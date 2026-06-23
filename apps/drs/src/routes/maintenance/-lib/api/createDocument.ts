import { registrarSvc } from '@repo/axios-config/registrar-service';

export type CreateDocumentPayload = {
  document_name: string;
  price: number;
  is_active: boolean;
  allow_multiple_per_request: boolean;
  supporting_document_requirements?: Array<{
    name: string;
    instructions?: string | null;
    is_required: boolean;
    is_active?: boolean;
    sort_order?: number | null;
    allowed_mime_types?: string[];
    max_file_size_kb?: number | null;
    max_files?: number | null;
  }>;
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
