import { registrarSvc } from '@repo/axios-config/registrar-service';

export type DownloadableForm = {
  id: string | number;
  name?: string;
  file_name: string;
  mime_type?: string | null;
  size: number;
  download_url: string;
  expires_at?: string | null;
  created_at?: string | null;
};

export type DownloadableFormOwnerKind = 'document' | 'package';

function ownerPath(kind: DownloadableFormOwnerKind, id: string | number): string {
  return kind === 'package'
    ? `v1/drs/packages/${id}/downloadable-forms`
    : `v1/drs/documents/${id}/downloadable-forms`;
}

export const uploadDownloadableForm = async (
  ownerId: string | number,
  file: File,
  kind: DownloadableFormOwnerKind = 'document',
): Promise<DownloadableForm> => {
  const body = new FormData();
  body.append('file', file);
  const { data } = await registrarSvc.post<{ data: DownloadableForm }>(
    ownerPath(kind, ownerId),
    body,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return data.data;
};

export const deleteDownloadableForm = async (
  ownerId: string | number,
  mediaId: string | number,
  kind: DownloadableFormOwnerKind = 'document',
): Promise<void> => {
  await registrarSvc.delete(`${ownerPath(kind, ownerId)}/${mediaId}`);
};
