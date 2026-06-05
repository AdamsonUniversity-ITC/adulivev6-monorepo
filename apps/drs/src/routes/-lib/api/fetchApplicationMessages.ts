import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { DRSApplicationMessageRow } from '../types/applications.ts';

export type FetchApplicationMessagesResult = {
  rows: DRSApplicationMessageRow[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export async function fetchApplicationMessages(
  applicationId: string,
  params?: { page?: number; perPage?: number },
): Promise<FetchApplicationMessagesResult> {
  const { data: body } = await registrarSvc.get<unknown>(
    `v1/drs/applications/${applicationId}/messages`,
    {
      params: {
        page: params?.page ?? 1,
        per_page: params?.perPage ?? 50,
      },
    },
  );

  if (!body || typeof body !== 'object') {
    return {
      rows: [],
      meta: { current_page: 1, last_page: 1, per_page: 50, total: 0 },
    };
  }

  const record = body as Record<string, unknown>;
  const rows = Array.isArray(record.data)
    ? (record.data as DRSApplicationMessageRow[])
    : [];
  const meta =
    record.meta && typeof record.meta === 'object'
      ? (record.meta as FetchApplicationMessagesResult['meta'])
      : { current_page: 1, last_page: 1, per_page: 50, total: rows.length };

  return { rows, meta };
}
