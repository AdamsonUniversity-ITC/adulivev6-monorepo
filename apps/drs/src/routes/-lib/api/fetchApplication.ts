import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { DRSApplicationDetail } from '../types/applications.ts';

export async function fetchApplication(
  applicationId: string,
): Promise<DRSApplicationDetail> {
  const { data: body } = await registrarSvc.get<unknown>(
    `v1/drs/applications/${applicationId}`,
  );

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Invalid application response');
  }

  return (body as { data: DRSApplicationDetail }).data;
}
