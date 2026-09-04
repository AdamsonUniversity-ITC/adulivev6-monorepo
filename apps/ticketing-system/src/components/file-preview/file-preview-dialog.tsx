import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { ExternalLink, FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  useFetchedObjectUrl,
  useObjectUrl,
} from "./use-object-url";
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
} from "./utils";

type FilePreviewDialogProps = {
  attachment: PreviewableAttachment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function DocumentPreviewFallback({
  name,
  size,
  kind,
  previewUrl,
}: {
  name: string;
  size: number;
  kind: FileKind;
  previewUrl: string | null;
}) {
  const label =
    kind === "document"
      ? "Document"
      : kind === "video"
        ? "Video"
        : kind === "other"
          ? "File"
          : "Document";

  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-10 text-center">
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
  );
}

export function FilePreviewDialog({
  attachment,
  open,
  onOpenChange,
}: FilePreviewDialogProps) {
  const localFile =
    attachment && !isRemoteFileAttachment(attachment) ? attachment : null;
  const localObjectUrl = useObjectUrl(localFile);
  const remoteAttachment =
    attachment && isRemoteFileAttachment(attachment) ? attachment : null;

  const { url: fetchedUrl, loading, error } = useFetchedObjectUrl(
    remoteAttachment?.fetchPreviewUrl,
    open && remoteAttachment?.fetchPreviewUrl != null,
  );

  const [staticRemoteUrl, setStaticRemoteUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !remoteAttachment) {
      setStaticRemoteUrl(null);
      return;
    }

    if (remoteAttachment.fetchPreviewUrl) {
      setStaticRemoteUrl(null);
      return;
    }

    setStaticRemoteUrl(getAttachmentPreviewUrl(remoteAttachment));
  }, [open, remoteAttachment]);

  const previewUrl = localObjectUrl ?? fetchedUrl ?? staticRemoteUrl;
  const kind = attachment ? getAttachmentKind(attachment) : "other";
  const showInlinePreview = attachment ? canPreviewInline(kind) : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b px-5 py-4">
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
          {loading ? (
            <div className="text-muted-foreground flex min-h-[280px] items-center justify-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Loading preview…
            </div>
          ) : null}

          {!loading && attachment && previewUrl && kind === "image" ? (
            <div className="flex items-center justify-center rounded-xl bg-slate-950/5 p-3 dark:bg-white/5">
              <img
                src={previewUrl}
                alt={getAttachmentName(attachment)}
                className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain shadow-sm"
              />
            </div>
          ) : null}

          {!loading && attachment && previewUrl && kind === "pdf" ? (
            <iframe
              src={previewUrl}
              title={getAttachmentName(attachment)}
              sandbox=""
              className="h-[70vh] w-full rounded-xl border bg-white"
            />
          ) : null}

          {!loading &&
          attachment &&
          (error || !previewUrl || !showInlinePreview) ? (
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
  );
}
