import { Paperclip } from "lucide-react"

import { RemoteFileAttachmentList } from "@/components/shared/file-dropzone"
import type { LeaveApplicationMediaRecord } from "@/lib/leave-applications-api"
import { cn } from "@/lib/utils"

type SupportingDocumentsSectionProps = {
  documents?: LeaveApplicationMediaRecord[]
  className?: string
}

export function SupportingDocumentsSection({
  documents,
  className,
}: SupportingDocumentsSectionProps) {
  if (!documents?.length) {
    return null
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-slate-50/70 p-3",
        className,
      )}
    >
      <p className="text-muted-foreground mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
        <Paperclip className="size-3.5" />
        Supporting documents
      </p>
      <RemoteFileAttachmentList files={documents} />
    </div>
  )
}
