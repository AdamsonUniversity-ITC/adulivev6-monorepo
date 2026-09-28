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

export const uploadDownloadableForm = async (
  documentId: string | number,
  file: File,
): Promise<DownloadableForm> => {
  const body = new FormData();
  body.append('file', file);
  const { data } = await registrarSvc.post<{ data: DownloadableForm }>(
    `v1/drs/documents/${documentId}/downloadable-forms`,
    body,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return data.data;
};

export const deleteDownloadableForm = async (
  documentId: string | number,
  mediaId: string | number,
): Promise<void> => {
  await registrarSvc.delete(
    `v1/drs/documents/${documentId}/downloadable-forms/${mediaId}`,
  );
};
