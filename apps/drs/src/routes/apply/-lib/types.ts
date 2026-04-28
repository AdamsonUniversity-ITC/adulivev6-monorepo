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

export type CatalogDocument = {
  id: number;
  document_name: string;
  price: string | number;
  is_active: boolean;
  allow_multiple_per_request?: boolean;
  rules?: DocumentRuleRow[] | null;
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
