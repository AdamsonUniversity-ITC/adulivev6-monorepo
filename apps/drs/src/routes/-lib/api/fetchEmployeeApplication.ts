import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { DRSApplicationDetail } from '../types/applications.ts';

export async function fetchEmployeeApplication(
  applicationId: string,
): Promise<DRSApplicationDetail> {
  const { data: body } = await registrarSvc.get<unknown>(
    `v1/drs/employee/applications/${applicationId}`,
  );

  if (!body || typeof body !== 'object') {
    throw new Error('Empty employee application payload');
  }

  const payload = body as Record<string, unknown>;
  const data = payload.data as DRSApplicationDetail | undefined;
  if (!data) {
    throw new Error('Missing application data');
  }

  return data;
}
