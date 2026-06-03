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
