export type FileKind = "image" | "pdf" | "document" | "other"

export type RemoteFileAttachment = {
  id: number
  uuid: string
  name: string
  file_name: string
  mime_type: string | null
  size: number
  url: string
}

export type PreviewableAttachment = File | RemoteFileAttachment

export function isRemoteFileAttachment(
  attachment: PreviewableAttachment,
): attachment is RemoteFileAttachment {
  return !(attachment instanceof File)
}

export function getAttachmentName(attachment: PreviewableAttachment): string {
  return attachment.name
}

export function getAttachmentSize(attachment: PreviewableAttachment): number {
  return attachment.size
}

export function getAttachmentPreviewUrl(
  attachment: PreviewableAttachment,
): string | null {
  if (isRemoteFileAttachment(attachment)) {
    return attachment.url
  }

  return null
}

export const DEFAULT_DOCUMENT_ACCEPT = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
} as const

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getFileKindFromMime(
  mimeType: string | null | undefined,
  fileName: string,
): FileKind {
  if (mimeType?.startsWith("image/")) return "image"
  if (mimeType === "application/pdf") return "pdf"
  if (
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "document"
  }

  const extension = fileName.split(".").pop()?.toLowerCase()
  if (extension === "pdf") return "pdf"
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension ?? "")) {
    return "image"
  }
  if (["doc", "docx"].includes(extension ?? "")) return "document"

  return "other"
}

export function getFileKind(file: File): FileKind {
  return getFileKindFromMime(file.type, file.name)
}

export function getAttachmentKind(attachment: PreviewableAttachment): FileKind {
  if (isRemoteFileAttachment(attachment)) {
    return getFileKindFromMime(attachment.mime_type, attachment.file_name)
  }

  return getFileKind(attachment)
}

export function canPreviewInline(kind: FileKind): boolean {
  return kind === "image" || kind === "pdf"
}

export function getAcceptedFileLabel(
  accept: Record<string, string[]> = DEFAULT_DOCUMENT_ACCEPT,
): string {
  const extensions = [
    ...new Set(
      Object.values(accept)
        .flat()
        .map((value) => value.replace(/^\./, "").toUpperCase()),
    ),
  ]

  return extensions.join(", ")
}
