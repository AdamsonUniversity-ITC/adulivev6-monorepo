import { registrarSvc } from '@repo/axios-config/registrar-service';

export type AssignmentHistoryRow = {
  id: string;
  description: string | null;
  event: string | null;
  properties: Record<string, unknown>;
  created_at: string | null;
};

export const fetchUserAssignmentHistory = async (
  empNo: string,
): Promise<AssignmentHistoryRow[]> => {
  const { data } = await registrarSvc.get<{ data: AssignmentHistoryRow[] }>(
    `v1/drs/user-management/users/${encodeURIComponent(empNo)}/history`,
  );

  return data.data ?? [];
};
