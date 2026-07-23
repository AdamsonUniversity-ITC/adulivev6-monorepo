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
  group_id?: string | number | null;
  document_name: string;
  price: number;
  account_code?: string;
  is_active: boolean;
  allow_multiple_per_request: boolean;
  once_per_student?: boolean;
  rules?: DocumentRule[];
  supporting_document_requirements?: SupportingDocumentRequirement[];
  required_companion_ids?: number[];
  required_companions?: Array<{
    id: string | number;
    required_document_id: string | number;
    required_document?: {
      id: string | number;
      document_name: string;
      is_active: boolean;
    } | null;
  }>;
};

export const fetchDocument = async (
  documentId: string | number,
): Promise<DocumentDetail> => {
  const { data } = await registrarSvc.get<DocumentDetail>(
    `v1/drs/documents/${documentId}`,
    {
      params: {
        with: 'rules.rule,supportingDocumentRequirements,requiredCompanions.requiredDocument',
      },
    },
  );
  return data;
};
