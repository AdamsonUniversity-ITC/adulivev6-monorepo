import { registrarSvc } from '@repo/axios-config/registrar-service';
import type { Employee } from './types.ts';

export const searchEmployees = async (q: string): Promise<Employee[]> => {
  const trimmed = q.trim();
  if (trimmed.length < 2) return [];

  const { data } = await registrarSvc.get<{ data?: Employee[] }>(
    'v1/drs/employee-search',
    { params: { q: trimmed } },
  );

  return Array.isArray(data?.data) ? data.data : [];
};
