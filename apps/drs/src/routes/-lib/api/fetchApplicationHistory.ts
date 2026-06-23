import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { DRSApplicationHistoryResponse } from '../types/history.ts';

export async function fetchApplicationHistory({
  applicationId,
  page,
  perPage,
}: {
  applicationId: string;
  page: number;
  perPage: number;
}): Promise<DRSApplicationHistoryResponse> {
  const { data } = await registrarSvc.get<{
    data?: unknown;
    meta?: DRSApplicationHistoryResponse['meta'];
  }>(`v1/drs/applications/${applicationId}/history`, {
    params: {
      page,
      per_page: perPage,
    },
  });

  return {
    rows: Array.isArray(data.data)
      ? (data.data as DRSApplicationHistoryResponse['rows'])
      : [],
    meta: data.meta ?? {
      current_page: page,
      last_page: 1,
      per_page: perPage,
      total: 0,
    },
  };
}
