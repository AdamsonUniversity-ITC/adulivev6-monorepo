import { registrarSvc } from '@repo/axios-config/registrar-service';

export const createPackage = async (new_package, group_id) => {
  const response = await registrarSvc.post(
    `v1/drs/document-groups/${group_id}/create-package`,
    new_package,
  );
  return response?.data;
};
