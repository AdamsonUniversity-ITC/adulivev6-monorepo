import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { DRSApplicationDetail } from '../types/applications.ts';

export type CompleteApplicationTaskPayload = {
  remarks?: string | null;
  reference_number?: string | null;
  tracking_number?: string | null;
  amount?: number | null;
  extra?: Record<string, unknown> | null;
};

export async function postCompleteApplicationTask(
  applicationId: string,
  taskId: string,
  payload: CompleteApplicationTaskPayload,
): Promise<DRSApplicationDetail> {
  const { data: body } = await registrarSvc.post<unknown>(
    `v1/drs/applications/${applicationId}/tasks/${taskId}/complete`,
    payload,
  );

  if (!body || typeof body !== 'object') {
    throw new Error('Empty complete-task response');
  }

  const record = body as Record<string, unknown>;
  const detail = record.data as DRSApplicationDetail | undefined;
  if (!detail) {
    throw new Error('Missing application data');
  }

  return detail;
}
