import { registrarSvc } from '@repo/axios-config/registrar-service';

export type EditDocumentPayload = {
  document_name: string;
  price: number;
  account_code: string;
  is_active: boolean;
  allow_multiple_per_request: boolean;
  once_per_student?: boolean;
  group_id?: number;
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
  required_companion_ids?: number[];
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
