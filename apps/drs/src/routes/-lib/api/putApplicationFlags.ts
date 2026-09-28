import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { DRSApplicationRow } from '../types/applications.ts';

export async function putApplicationFlags(
  applicationId: string,
  flags: string[],
): Promise<DRSApplicationRow> {
  const { data: body } = await registrarSvc.put<{ data: DRSApplicationRow }>(
    `v1/drs/employee/applications/${encodeURIComponent(applicationId)}/flags`,
    { flags },
  );

  return body.data;
}
