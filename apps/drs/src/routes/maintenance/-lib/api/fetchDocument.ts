import { registrarSvc } from '@repo/axios-config/registrar-service';

export type DocumentRule = {
  rule: {
    rule_name: string;
    rule_type: string;
  };
};

export type SupportingDocumentRequirement = {
  id: string | number;
  name: string;
  instructions?: string | null;
  is_required: boolean;
  is_active: boolean;
  sort_order?: number;
  allowed_mime_types?: string[] | null;
  max_file_size_kb?: number | null;
  max_files?: number | null;
};

export type DocumentDetail = {
  id: string | number;
  document_name: string;
  price: number;
  is_active: boolean;
  allow_multiple_per_request: boolean;
  rules?: DocumentRule[];
  supporting_document_requirements?: SupportingDocumentRequirement[];
};

export const fetchDocument = async (
  documentId: string | number,
): Promise<DocumentDetail> => {
  const { data } = await registrarSvc.get<DocumentDetail>(
    `v1/drs/documents/${documentId}`,
    { params: { with: 'rules.rule,supportingDocumentRequirements' } },
  );
  return data;
};
