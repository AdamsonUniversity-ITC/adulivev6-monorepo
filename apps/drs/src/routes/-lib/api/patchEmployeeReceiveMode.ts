import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { DRSApplicationDetail } from '../types/applications.ts';

export type PatchEmployeeReceiveModePayload = {
  receive_mode: 'delivery' | 'pickup';
  delivery_address?: string | null;
};

export async function patchEmployeeReceiveMode(
  applicationId: string,
  payload: PatchEmployeeReceiveModePayload,
): Promise<DRSApplicationDetail> {
  const { data: body } = await registrarSvc.patch<unknown>(
    `v1/drs/employee/applications/${applicationId}/receive-mode`,
    payload,
  );

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Invalid application response');
  }

  return (body as { data: DRSApplicationDetail }).data;
}
