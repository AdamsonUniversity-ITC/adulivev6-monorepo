export type DocumentRuleRow = {
  document_id?: number;
  rule_id?: number;
  rule?: {
    id: number;
    rule_name: string;
    display_name?: string | null;
    rule_type?: string | null;
  } | null;
};

export type SupportingDocumentRequirement = {
  id: number;
  name: string;
  instructions?: string | null;
  is_required: boolean;
  is_active: boolean;
  sort_order?: number;
  allowed_mime_types?: string[] | null;
  max_file_size_kb?: number | null;
  max_files?: number | null;
};

export type CatalogDocument = {
  id: number;
  document_name: string;
  price: string | number;
  is_active: boolean;
  allow_multiple_per_request?: boolean;
  rules?: DocumentRuleRow[] | null;
  supporting_document_requirements?: SupportingDocumentRequirement[] | null;
};

export type CatalogPackage = {
  id: number;
  package_name: string;
  price: string | number;
  is_active: boolean;
  allow_multiple_per_request?: boolean;
  rules?: DocumentRuleRow[] | null;
};

export type CatalogGroup = {
  id: number;
  group_name: string;
  documents?: CatalogDocument[] | null;
  packages?: CatalogPackage[] | null;
};
