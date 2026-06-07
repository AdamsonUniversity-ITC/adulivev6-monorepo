import { FileAttachmentList } from "./file-attachment-list"
import type { RemoteFileAttachment } from "./utils"

type RemoteFileAttachmentListProps = {
  files: RemoteFileAttachment[]
  showPreview?: boolean
  className?: string
}

export function RemoteFileAttachmentList({
  files,
  showPreview = true,
  className,
}: RemoteFileAttachmentListProps) {
  return (
    <FileAttachmentList
      files={files}
      showPreview={showPreview}
      className={className}
    />
  )
}
