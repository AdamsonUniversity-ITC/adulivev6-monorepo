import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { DRSApplicationMessageRow } from '../types/applications.ts';

export type PostApplicationMessagePayload = {
  body?: string;
  temp_upload_ids?: Array<string | number>;
};

export async function postApplicationMessage(
  applicationId: string,
  payload: PostApplicationMessagePayload,
): Promise<DRSApplicationMessageRow> {
  const body = payload.body?.trim() ?? '';
  const tempUploadIds = payload.temp_upload_ids ?? [];
  const { data: bodyJson } = await registrarSvc.post<unknown>(
    `v1/drs/applications/${applicationId}/messages`,
    {
      ...(body ? { body } : {}),
      ...(tempUploadIds.length > 0
        ? { temp_upload_ids: tempUploadIds.map((id) => Number(id)) }
        : {}),
    },
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
