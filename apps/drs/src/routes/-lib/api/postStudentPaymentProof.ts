import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { DRSApplicationDetail } from '../types/applications.ts';

export type StudentPaymentProofPayload = {
  reference_number: string;
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

  if (!body || typeof body !== 'object') {
    throw new Error('Empty payment response');
  }

  const record = body as Record<string, unknown>;
  const detail = record.data as DRSApplicationDetail | undefined;
  if (!detail) {
    throw new Error('Missing application data');
  }

  return detail;
}
