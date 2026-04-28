import { registrarSvc } from '@repo/axios-config/registrar-service';

export type CreatePackagePayload = {
  package_name: string;
  price: number;
  is_active: boolean;
  allow_multiple_per_request: boolean;
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
