import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { DRSApplicationMessageRow } from '../types/applications.ts';

export async function postApplicationMessage(
  applicationId: string,
  body: string,
): Promise<DRSApplicationMessageRow> {
  const { data: bodyJson } = await registrarSvc.post<unknown>(
    `v1/drs/applications/${applicationId}/messages`,
    { body },
  );

  if (
    !bodyJson ||
    typeof bodyJson !== 'object' ||
    !('data' in bodyJson) ||
    typeof (bodyJson as { data: unknown }).data !== 'object'
  ) {
    throw new Error('Invalid message response');
  }

  return (bodyJson as { data: DRSApplicationMessageRow }).data;
}
