import { registrarSvc } from '@repo/axios-config/registrar-service';

import type { DRSApplicationRow } from '../types/applications.ts';

export type EmployeeApplicationsMeta = {
  current_page: number;
  last_page?: number;
  per_page: number;
  total: number;
};

export type EmployeeProgramOption = {
  id: string;
  label: string;
};

export async function fetchEmployeePrograms(): Promise<EmployeeProgramOption[]> {
  const { data: body } = await registrarSvc.get<unknown>(
    'v1/drs/employee/me/programs',
  );

  if (!body || typeof body !== 'object') return [];

  const data = (body as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];

  return data.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const record = row as { id?: unknown; label?: unknown };
    const id = typeof record.id === 'string' ? record.id.trim() : '';
    if (id === '') return [];
    const label =
      typeof record.label === 'string' && record.label.trim() !== ''
        ? record.label.trim()
        : id;

    return [{ id, label }];
  });
}

export async function fetchEmployeeApplications(params: {
  page: number;
  perPage: number;
  search?: string;
  status?: string;
  clearanceLabel?: string;
  flag?: string;
  courseId?: string;
}): Promise<{ rows: DRSApplicationRow[]; meta: EmployeeApplicationsMeta }> {
  const { data: body } = await registrarSvc.get<unknown>(
    'v1/drs/employee/applications',
    {
      params: {
        page: params.page,
        per_page: params.perPage,
        ...(params.search?.trim() ? { search: params.search.trim() } : {}),
        ...(params.clearanceLabel?.trim()
          ? { clearance_label: params.clearanceLabel.trim() }
          : params.status?.trim()
            ? { status: params.status.trim() }
            : {}),
        ...(params.flag?.trim() ? { flag: params.flag.trim() } : {}),
        ...(params.courseId?.trim() ? { course_id: params.courseId.trim() } : {}),
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

export async function fetchIncomingApplicationCount(
  since: string,
  courseId?: string,
): Promise<number> {
  const { data: body } = await registrarSvc.get<unknown>(
    'v1/drs/employee/applications/incoming-count',
    {
      params: {
        since,
        ...(courseId?.trim() ? { course_id: courseId.trim() } : {}),
      },
    },
  );

  if (!body || typeof body !== 'object') return 0;
  const count = (body as { count?: unknown }).count;
  return typeof count === 'number' && Number.isFinite(count) ? count : 0;
}
