import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { DRSApplicationDetail } from '../types/applications.ts';

export async function postRestoreApplicationHistory({
  applicationId,
  historyId,
}: {
  applicationId: string;
  historyId: string;
}): Promise<DRSApplicationDetail> {
  const { data: body } = await registrarSvc.post<unknown>(
    `v1/drs/applications/${applicationId}/history/${historyId}/restore`,
  );

  if (!body || typeof body !== 'object') {
    throw new Error('Empty restore payload');
  }

  const payload = body as Record<string, unknown>;
  const data = payload.data as DRSApplicationDetail | undefined;
  if (!data) {
    throw new Error('Missing restored application data');
  }

  return data;
}
