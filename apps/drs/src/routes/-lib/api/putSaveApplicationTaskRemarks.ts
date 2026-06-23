import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { DRSApplicationDetail } from '../types/applications.ts';

export async function putSaveApplicationTaskRemarks(
  applicationId: string,
  taskId: string,
  remarks: string | null,
  kind?: string | null,
): Promise<DRSApplicationDetail> {
  const endpoint =
    kind === 'clearance_signoff'
      ? `v1/drs/applications/${applicationId}/tasks/${taskId}/clearance-remarks`
      : `v1/drs/applications/${applicationId}/tasks/${taskId}/remarks`;

  const { data: body } = await registrarSvc.put<unknown>(endpoint, {
    remarks,
  });

  if (!body || typeof body !== 'object') {
    throw new Error('Empty save-remarks response');
  }

  const record = body as Record<string, unknown>;
  const detail = record.data as DRSApplicationDetail | undefined;
  if (!detail) {
    throw new Error('Missing application data');
  }

  return detail;
}
