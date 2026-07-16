import { registrarSvc } from '@repo/axios-config/registrar-service';

export type ImportTaskKindAccessSummary = {
  users: {
    imported: number;
    skipped: number;
  };
  roles: {
    imported: number;
    skipped: number;
  };
};

export const importTaskKindAccess = async (
  kind: string,
  payload: { source_kind: string },
): Promise<ImportTaskKindAccessSummary> => {
  const encoded = encodeURIComponent(kind);
  const { data } = await registrarSvc.post<{
    data: ImportTaskKindAccessSummary;
  }>(`v1/drs/workflow/task-kinds/${encoded}/access/import`, payload);

  return data.data;
};
