import { useState } from "react"

import { FileAttachmentItem } from "./file-attachment-item"
import { FilePreviewDialog } from "./file-preview-dialog"
import type { PreviewableAttachment } from "./utils"

type FileAttachmentListProps = {
  files: PreviewableAttachment[]
  showPreview?: boolean
  className?: string
}

export function FileAttachmentList({
  files,
  showPreview = true,
  className,
}: FileAttachmentListProps) {
  const [previewAttachment, setPreviewAttachment] =
    useState<PreviewableAttachment | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  if (files.length === 0) {
    return null
  }

  return (
    <>
      <ul className={className ?? "space-y-2"}>
        {files.map((attachment, index) => (
          <FileAttachmentItem
            key={
              attachment instanceof File
                ? `${attachment.name}-${attachment.lastModified}-${index}`
                : `${attachment.uuid}-${index}`
            }
            attachment={attachment}
            showPreview={showPreview}
            onPreview={() => {
              setPreviewAttachment(attachment)
              setPreviewOpen(true)
            }}
          />
        ))}
      </ul>

      <FilePreviewDialog
        attachment={previewAttachment}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </>
  )
}
