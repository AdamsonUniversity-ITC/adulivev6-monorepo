import { registrarSvc } from '@repo/axios-config/registrar-service';

export type EditPackagePayload = {
  package_name: string;
  waive_fees?: boolean;
  is_active: boolean;
  allow_multiple_per_request: boolean;
  once_per_student?: boolean;
  check_assessment?: boolean;
  check_first_transaction?: boolean;
  group_id?: number;
  package_rules?: {
    graduate?: boolean;
    undergraduate?: boolean;
    enrolled?: boolean;
    unenrolled?: boolean;
  };
  included_items?: Array<{
    id?: number | string | null;
    document_id?: number | null;
    label: string;
    amount?: number | null;
    account_code?: string | null;
    sort_order?: number | null;
  }>;
};

export const editPackage = async (
  packageId: string | number,
  payload: EditPackagePayload,
) => {
  const response = await registrarSvc.patch(
    `v1/drs/packages/${packageId}`,
    payload,
  );
  return response?.data;
};
