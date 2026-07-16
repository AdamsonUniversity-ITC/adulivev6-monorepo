import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { DRSApplicationDetail } from '../types/applications.ts';

export async function postCancelApplication(
  applicationId: string,
): Promise<DRSApplicationDetail> {
  const { data: body } = await registrarSvc.post<unknown>(
    `v1/drs/applications/${applicationId}/cancel`,
  );

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Invalid application response');
  }

  return (body as { data: DRSApplicationDetail }).data;
}
