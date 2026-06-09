import { Eye, FileText, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { useObjectUrl } from "./use-object-url"
import {
  formatFileSize,
  getAttachmentKind,
  getAttachmentName,
  getAttachmentPreviewUrl,
  getAttachmentSize,
  isRemoteFileAttachment,
  type PreviewableAttachment,
} from "./utils"

type FileAttachmentItemProps = {
  attachment: PreviewableAttachment
  onPreview?: () => void
  onRemove?: () => void
  showPreview?: boolean
  className?: string
}

export function FileAttachmentItem({
  attachment,
  onPreview,
  onRemove,
  showPreview = true,
  className,
}: FileAttachmentItemProps) {
  const localFile = isRemoteFileAttachment(attachment) ? null : attachment
  const objectUrl = useObjectUrl(localFile)
  const previewUrl = getAttachmentPreviewUrl(attachment) ?? objectUrl
  const kind = getAttachmentKind(attachment)
  const name = getAttachmentName(attachment)

  return (
    <li
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {kind === "image" && previewUrl ? (
          <div className="size-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <img
              src={previewUrl}
              alt={name}
              className="size-full object-cover"
            />
          </div>
        ) : (
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-lg",
              kind === "pdf"
                ? "bg-red-50 text-red-600"
                : kind === "document"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-primary/10 text-primary",
            )}
          >
            <FileText className="size-5" />
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="text-muted-foreground text-xs">
            {formatFileSize(getAttachmentSize(attachment))}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {showPreview && onPreview ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onPreview}
            aria-label={`Preview ${name}`}
          >
            <Eye className="size-4" />
          </Button>
        ) : null}

        {onRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            aria-label={`Remove ${name}`}
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
    </li>
  )
}
