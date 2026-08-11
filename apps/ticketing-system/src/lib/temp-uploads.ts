import { hrmdoSvc } from "@repo/axios-config/hrmdo-service";
import type { PreuploadedFile } from "@repo/ui/components/file-dropzone";

export type TempUpload = PreuploadedFile & {
  uuid?: string;
  url: string;
};

export async function uploadTempFile(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<TempUpload> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("system_type", "aduts");

  const { data } = await hrmdoSvc.post<{ data: TempUpload }>(
    "v1/shared/temp-uploads",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (!event.total) return;
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      },
    },
  );

  return data.data;
}

export async function uploadTempImageForEditor(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<TempUpload> {
  return uploadTempFile(file, onProgress);
}

export async function deleteTempUpload(tempUploadId: string | number) {
  await hrmdoSvc.delete(`v1/shared/temp-uploads/${tempUploadId}`);
}
