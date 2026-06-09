import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog"
import { ExternalLink, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"

import { useObjectUrl } from "./use-object-url"
import {
  canPreviewInline,
  formatFileSize,
  getAttachmentKind,
  getAttachmentName,
  getAttachmentPreviewUrl,
  getAttachmentSize,
  isRemoteFileAttachment,
  type FileKind,
  type PreviewableAttachment,
} from "./utils"

type FilePreviewDialogProps = {
  attachment: PreviewableAttachment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function DocumentPreviewFallback({
  name,
  size,
  kind,
  previewUrl,
}: {
  name: string
  size: number
  kind: FileKind
  previewUrl: string | null
}) {
  const label =
    kind === "document"
      ? "Word document"
      : kind === "other"
        ? "File"
        : "Document"

  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
      <div className="bg-primary/10 text-primary flex size-16 items-center justify-center rounded-2xl">
        <FileText className="size-8" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{name}</p>
        <p className="text-muted-foreground text-xs">
          {label} · {formatFileSize(size)}
        </p>
        <p className="text-muted-foreground max-w-sm text-xs leading-relaxed">
          Inline preview is not available for this file type. Open the file in a
          new tab to view it.
        </p>
      </div>
      {previewUrl ? (
        <Button asChild variant="outline" size="sm">
          <a href={previewUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" />
            Open file
          </a>
        </Button>
      ) : null}
    </div>
  )
}

export function FilePreviewDialog({
  attachment,
  open,
  onOpenChange,
}: FilePreviewDialogProps) {
  const localFile =
    attachment && !isRemoteFileAttachment(attachment) ? attachment : null
  const objectUrl = useObjectUrl(localFile)
  const previewUrl = attachment
    ? getAttachmentPreviewUrl(attachment) ?? objectUrl
    : null
  const kind = attachment ? getAttachmentKind(attachment) : "other"
  const showInlinePreview = attachment ? canPreviewInline(kind) : false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-slate-100 px-5 py-4">
          <DialogTitle className="truncate pr-8 text-base">
            {attachment ? getAttachmentName(attachment) : "File preview"}
          </DialogTitle>
          {attachment ? (
            <DialogDescription>
              {formatFileSize(getAttachmentSize(attachment))}
              {showInlinePreview ? " · Preview" : " · Document file"}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="overflow-auto p-4 sm:p-5">
          {attachment && previewUrl && kind === "image" ? (
            <div className="flex items-center justify-center rounded-xl bg-slate-950/5 p-3">
              <img
                src={previewUrl}
                alt={getAttachmentName(attachment)}
                className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain shadow-sm"
              />
            </div>
          ) : null}

          {attachment && previewUrl && kind === "pdf" ? (
            <iframe
              src={previewUrl}
              title={getAttachmentName(attachment)}
              className="h-[70vh] w-full rounded-xl border border-slate-200 bg-white"
            />
          ) : null}

          {attachment && !showInlinePreview ? (
            <DocumentPreviewFallback
              name={getAttachmentName(attachment)}
              size={getAttachmentSize(attachment)}
              kind={kind}
              previewUrl={previewUrl}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
