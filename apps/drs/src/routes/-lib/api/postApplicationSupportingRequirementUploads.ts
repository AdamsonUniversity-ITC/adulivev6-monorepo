import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { DRSApplicationDetail } from '../types/applications.ts';

export async function postApplicationSupportingRequirementUploads(
  applicationId: string,
  requirementId: string,
  tempUploadIds: Array<string | number>,
): Promise<DRSApplicationDetail> {
  const { data: body } = await registrarSvc.post<unknown>(
    `v1/drs/applications/${applicationId}/supporting-requirements/${requirementId}/uploads`,
    {
      temp_upload_ids: tempUploadIds.map((id) => Number(id)),
    },
  );

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Invalid supporting upload response');
  }

  return (body as { data: DRSApplicationDetail }).data;
}
