import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { DRSApplicationRow } from '../types/applications.ts';

export type FetchApplicationsParams = {
  page: number;
  perPage: number;
  sort: string;
  order: 'asc' | 'desc';
  search: string;
};

export type FetchApplicationsResult = {
  rows: DRSApplicationRow[];
  total: number;
};

export async function fetchApplications(
  params: FetchApplicationsParams,
): Promise<FetchApplicationsResult> {
  const { data: body } = await registrarSvc.get<unknown>(
    'v1/drs/applications',
    {
      params: {
        page: params.page,
        per_page: params.perPage,
        sort: params.sort,
        order: params.order,
        search: params.search || undefined,
      },
    },
  );

  if (!body || typeof body !== 'object') {
    return { rows: [], total: 0 };
  }

  const record = body as Record<string, unknown>;
  const rows = Array.isArray(record.data)
    ? (record.data as DRSApplicationRow[])
    : [];
  const meta =
    record.meta && typeof record.meta === 'object'
      ? (record.meta as Record<string, unknown>)
      : null;
  const total = typeof meta?.total === 'number' ? meta.total : rows.length;

  return { rows, total };
}
