import {
  FileDropzone,
  type PreuploadedFile,
} from "@repo/ui/components/file-dropzone";

import { deleteTempUpload, uploadTempFile } from "@/lib/temp-uploads";

export const TICKET_ATTACHMENT_ACCEPT = {
  "image/jpeg": [],
  "image/png": [],
  "image/webp": [],
  "image/gif": [],
  "application/pdf": [],
  "application/msword": [],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
  "application/vnd.ms-excel": [],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [],
  "text/plain": [],
  "video/mp4": [],
  "video/webm": [],
} as const;

export const TICKET_ATTACHMENT_MAX_FILES = 5;
/** Largest allowed kind (video). */
export const TICKET_ATTACHMENT_MAX_SIZE = 25 * 1024 * 1024;

export const TICKET_ATTACHMENT_ACCEPT_ATTR = Object.keys(
  TICKET_ATTACHMENT_ACCEPT,
).join(",");

type Props = {
  value: PreuploadedFile[];
  onChange: (uploads: PreuploadedFile[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
  disabled?: boolean;
  label?: string;
};

export function TicketAttachmentDropzone({
  value,
  onChange,
  onUploadingChange,
  disabled,
  label = "Attachments",
}: Props) {
  return (
    <FileDropzone
      label={label}
      description="Images, documents, or short videos. Files upload immediately."
      value={value}
      onChange={onChange}
      uploadFile={uploadTempFile}
      deleteFile={deleteTempUpload}
      accept={TICKET_ATTACHMENT_ACCEPT}
      maxFiles={TICKET_ATTACHMENT_MAX_FILES}
      maxSize={TICKET_ATTACHMENT_MAX_SIZE}
      disabled={disabled}
      onUploadingChange={onUploadingChange}
    />
  );
}
