import { Button } from '@repo/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog';
import { toast } from '@repo/ui/exports';
import * as React from 'react';

import {
  canPreviewPrivateFile,
  downloadPrivateFile,
  fetchPrivateFileBlob,
} from '@/lib/downloadPrivateFile.ts';

export type PrivateFilePreviewTarget = {
  url: string;
  fileName: string;
  mimeType?: string | null;
  expiresAt?: string | null;
};

type PrivateFilePreviewDialogProps = {
  file: PrivateFilePreviewTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PrivateFilePreviewDialog({
  file,
  open,
  onOpenChange,
}: PrivateFilePreviewDialogProps) {
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const previewable = canPreviewPrivateFile(file?.mimeType);
  const isImage = Boolean(file?.mimeType?.startsWith('image/'));
  const isPdf = file?.mimeType === 'application/pdf';

  React.useEffect(() => {
    if (!open || !file || !previewable) {
      setObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    let createdUrl: string | null = null;

    setLoading(true);
    setError(null);
    setObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    const load = async () => {
      try {
        // Signed/private downloads need authenticated blob fetch. Public URLs can
        // be used directly, but blob fetch keeps Content-Disposition consistent.
        const blob = file.expiresAt
          ? await fetchPrivateFileBlob(file.url)
          : await fetchPrivateFileBlob(file.url).catch(async () => {
              const response = await fetch(file.url, {
                credentials: 'include',
              });
              if (!response.ok) {
                throw new Error('Failed to load file');
              }
              return response.blob();
            });

        if (cancelled) return;

        createdUrl = URL.createObjectURL(blob);
        setObjectUrl(createdUrl);
      } catch {
        if (!cancelled) {
          setError('Could not load preview. Try downloading the file instead.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [open, file, previewable]);

  const handleDownload = () => {
    if (!file) return;
    if (file.expiresAt) {
      void downloadPrivateFile(file.url, file.fileName).catch(() => {
        toast.error('Failed to download file. Please refresh and try again.');
      });
      return;
    }
    window.open(file.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-border shrink-0 border-b px-6 py-4">
          <DialogTitle className="truncate pr-8">
            {file?.fileName ?? 'File preview'}
          </DialogTitle>
          <DialogDescription>
            {previewable
              ? 'Preview of the uploaded file.'
              : 'This file type cannot be previewed in the browser.'}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/20 flex min-h-[280px] flex-1 items-center justify-center overflow-auto p-4">
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading preview…</p>
          ) : null}
          {!loading && error ? (
            <p className="text-muted-foreground text-sm">{error}</p>
          ) : null}
          {!loading && !error && !previewable ? (
            <p className="text-muted-foreground max-w-sm text-center text-sm">
              Preview is available for images and PDF files. Use Download to
              open this file on your device.
            </p>
          ) : null}
          {!loading && !error && objectUrl && isImage ? (
            <img
              src={objectUrl}
              alt={file?.fileName ?? 'Uploaded image'}
              className="max-h-[70vh] max-w-full object-contain"
            />
          ) : null}
          {!loading && !error && objectUrl && isPdf ? (
            <iframe
              title={file?.fileName ?? 'PDF preview'}
              src={objectUrl}
              className="bg-background h-[70vh] w-full rounded border"
            />
          ) : null}
        </div>

        <DialogFooter className="border-border shrink-0 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={handleDownload}>
            Download
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
