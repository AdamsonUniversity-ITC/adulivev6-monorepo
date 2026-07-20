import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { DRSApplicationRow } from '../types/applications.ts';

export type EmployeeApplicationsMeta = {
  current_page: number;
  last_page?: number;
  per_page: number;
  total: number;
};

export async function fetchEmployeeApplications(params: {
  page: number;
  perPage: number;
  search?: string;
  status?: string;
}): Promise<{ rows: DRSApplicationRow[]; meta: EmployeeApplicationsMeta }> {
  const { data: body } = await registrarSvc.get<unknown>(
    'v1/drs/employee/applications',
    {
      params: {
        page: params.page,
        per_page: params.perPage,
        ...(params.search?.trim() ? { search: params.search.trim() } : {}),
        ...(params.status?.trim() ? { status: params.status.trim() } : {}),
      },
    },
  );

  if (!body || typeof body !== 'object') {
    return {
      rows: [],
      meta: { current_page: 1, per_page: params.perPage, total: 0 },
    };
  }

  const record = body as Record<string, unknown>;
  const rows = Array.isArray(record.data)
    ? (record.data as DRSApplicationRow[])
    : [];
  const metaRaw =
    record.meta && typeof record.meta === 'object'
      ? (record.meta as Record<string, unknown>)
      : {};

  const meta: EmployeeApplicationsMeta = {
    current_page:
      typeof metaRaw.current_page === 'number' ? metaRaw.current_page : 1,
    last_page:
      typeof metaRaw.last_page === 'number' ? metaRaw.last_page : undefined,
    per_page:
      typeof metaRaw.per_page === 'number' ? metaRaw.per_page : params.perPage,
    total: typeof metaRaw.total === 'number' ? metaRaw.total : rows.length,
  };

  return { rows, meta };
}
