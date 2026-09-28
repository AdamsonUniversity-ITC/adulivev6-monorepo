import { registrarSvc } from '@repo/axios-config/registrar-service';

export type CreatePackagePayload = {
  package_name: string;
  price: number;
  is_active: boolean;
  allow_multiple_per_request: boolean;
  once_per_student?: boolean;
  included_items?: Array<{
    id?: number | string | null;
    document_id?: number | null;
    label: string;
    account_code?: string | null;
    sort_order?: number | null;
  }>;
};

export const createPackage = async (
  payload: CreatePackagePayload,
  groupId: string | number,
) => {
  const response = await registrarSvc.post(
    `v1/drs/document-groups/${groupId}/create-package`,
    payload,
  );
  return response?.data;
};
