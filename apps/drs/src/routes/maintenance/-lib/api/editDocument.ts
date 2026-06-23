import { registrarSvc } from '@repo/axios-config/registrar-service';

export type EditDocumentPayload = {
  document_name: string;
  price: number;
  is_active: boolean;
  allow_multiple_per_request: boolean;
  rules?: {
    graduate?: boolean;
    undergraduate?: boolean;
    enrolled?: boolean;
    unenrolled?: boolean;
  };
  supporting_document_requirements?: Array<{
    id?: string | number | null;
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

export const editDocument = async (
  documentId: string | number,
  payload: EditDocumentPayload,
) => {
  const response = await registrarSvc.patch(
    `v1/drs/documents/${documentId}`,
    payload,
  );
  return response?.data;
};
