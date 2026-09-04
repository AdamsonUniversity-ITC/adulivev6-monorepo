export type FileKind = "image" | "pdf" | "document" | "video" | "other";

export type RemoteFileAttachment = {
  id: number | string;
  name: string;
  file_name?: string;
  mime_type: string | null;
  size: number;
  url?: string;
  kind?: string;
  fetchPreviewUrl?: () => Promise<string>;
};

export type PreviewableAttachment = File | RemoteFileAttachment;

export function isRemoteFileAttachment(
  attachment: PreviewableAttachment,
): attachment is RemoteFileAttachment {
  return !(attachment instanceof File);
}

export function getAttachmentName(attachment: PreviewableAttachment): string {
  if (isRemoteFileAttachment(attachment)) {
    return attachment.name;
  }

  return attachment.name;
}

export function getAttachmentSize(attachment: PreviewableAttachment): number {
  if (isRemoteFileAttachment(attachment)) {
    return attachment.size;
  }

  return attachment.size;
}

export function getAttachmentPreviewUrl(
  attachment: PreviewableAttachment,
): string | null {
  if (isRemoteFileAttachment(attachment)) {
    return attachment.url ?? null;
  }

  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileKindFromMime(
  mimeType: string | null | undefined,
  fileName: string,
  kindHint?: string | null,
): FileKind {
  if (kindHint === "image" || kindHint === "pdf" || kindHint === "document" || kindHint === "video") {
    return kindHint;
  }

  if (mimeType?.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType?.startsWith("video/")) return "video";
  if (
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/vnd.ms-excel" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "text/plain"
  ) {
    return "document";
  }

  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension ?? "")) {
    return "image";
  }
  if (["mp4", "webm"].includes(extension ?? "")) return "video";
  if (["doc", "docx", "xls", "xlsx", "txt"].includes(extension ?? "")) {
    return "document";
  }

  return "other";
}

export function getFileKind(file: File): FileKind {
  return getFileKindFromMime(file.type, file.name);
}

export function getAttachmentKind(attachment: PreviewableAttachment): FileKind {
  if (isRemoteFileAttachment(attachment)) {
    return getFileKindFromMime(
      attachment.mime_type,
      attachment.file_name ?? attachment.name,
      attachment.kind,
    );
  }

  return getFileKind(attachment);
}

export function canPreviewInline(kind: FileKind): boolean {
  return kind === "image" || kind === "pdf";
}
