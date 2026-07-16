import { registrarSvc } from '@repo/axios-config/registrar-service';

export type TempUpload = {
  id: string;
  uuid: string;
  original_name: string;
  mime_type: string | null;
  size: number;
  expires_at: string | null;
};

export async function uploadTempFile(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<TempUpload> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await registrarSvc.post<{ data: TempUpload }>(
    'v1/shared/temp-uploads',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (!event.total) return;
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      },
    },
  );

  return data.data;
}

export async function deleteTempUpload(tempUploadId: string | number) {
  await registrarSvc.delete(`v1/shared/temp-uploads/${tempUploadId}`);
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 KB';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
