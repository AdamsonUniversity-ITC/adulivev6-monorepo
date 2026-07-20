import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { DRSApplicationDetail } from '../types/applications.ts';

export type StudentPaymentProofPayload = {
  temp_upload_ids: number[];
  remarks?: string | null;
};

export async function postStudentPaymentProof(
  applicationId: string,
  payload: StudentPaymentProofPayload,
): Promise<DRSApplicationDetail> {
  const { data: body } = await registrarSvc.post<unknown>(
    `v1/drs/applications/${applicationId}/payment-proof`,
    payload,
  );

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Invalid application response');
  }

  return (body as { data: DRSApplicationDetail }).data;
}
