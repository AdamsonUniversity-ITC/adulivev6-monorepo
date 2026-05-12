import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { DRSApplicationDetail } from '../types/applications.ts';

export type PatchApplicationPayload = {
  email: string;
  contact_number: string;
  receive_mode: 'email' | 'delivery' | 'pickup';
  delivery_address?: string | null;
  purpose?: string | null;
  lines: Array<{
    requestable_type: 'document' | 'package';
    requestable_id: number;
    quantity: number;
  }>;
};

export async function patchApplication(
  applicationId: string,
  payload: PatchApplicationPayload,
): Promise<DRSApplicationDetail> {
  const { data: body } = await registrarSvc.patch<unknown>(
    `v1/drs/applications/${applicationId}`,
    payload,
  );

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Invalid application response');
  }

  return (body as { data: DRSApplicationDetail }).data;
}
