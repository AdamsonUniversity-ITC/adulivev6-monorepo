import { registrarSvc } from '@repo/axios-config/registrar-service';

export type DocumentRule = {
  rule: {
    rule_name: string;
    rule_type: string;
  };
};

export type DocumentDetail = {
  id: string | number;
  document_name: string;
  price: number;
  is_active: boolean;
  allow_multiple_per_request: boolean;
  rules?: DocumentRule[];
};

export const fetchDocument = async (
  documentId: string | number,
): Promise<DocumentDetail> => {
  const { data } = await registrarSvc.get<DocumentDetail>(
    `v1/drs/documents/${documentId}`,
    { params: { with: 'rules.rule' } },
  );
  return data;
};
