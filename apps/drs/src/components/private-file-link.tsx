import { Button } from '@repo/ui/components/button';
import { toast } from '@repo/ui/exports';
import { Download, Eye, FileUp } from 'lucide-react';
import * as React from 'react';

import { PrivateFilePreviewDialog } from '@/components/private-file-preview-dialog.tsx';
import {
  canPreviewPrivateFile,
  downloadPrivateFile,
} from '@/lib/downloadPrivateFile.ts';
import { formatFileSize } from '@/lib/tempUploads.ts';

export type PrivateFileLinkFile = {
  id: string;
  url: string;
  file_name: string;
  mime_type?: string | null;
  size?: number;
  expires_at?: string | null;
  created_at?: string | null;
};

type PrivateFileLinkProps = {
  file: PrivateFileLinkFile;
  meta?: React.ReactNode;
  className?: string;
};

function formatExpiryTime(expiresAt: string): string {
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return expiresAt;
  return date.toLocaleString();
}

export function PrivateFileLink({
  file,
  meta,
  className,
}: PrivateFileLinkProps) {
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const previewable = canPreviewPrivateFile(file.mime_type);

  const handleDownload = () => {
    if (file.expires_at) {
      void downloadPrivateFile(file.url, file.file_name).catch(() => {
        toast.error('Failed to download file. Please refresh and try again.');
      });
      return;
    }
    window.open(file.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div
        className={
          className ?? 'flex flex-wrap items-center gap-x-3 gap-y-1 text-sm'
        }
      >
        <span className="inline-flex max-w-full min-w-0 items-center gap-2">
          {file.expires_at ? (
            <FileUp
              className="text-muted-foreground h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />
          ) : null}
          <span className="min-w-0">
            <span className="block font-medium wrap-anywhere">
              {file.file_name}
            </span>
            {file.expires_at ? (
              <span className="text-muted-foreground block text-xs">
                Private file - expires {formatExpiryTime(file.expires_at)}
              </span>
            ) : null}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-0.5">
          {previewable ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              title="Preview"
              aria-label={`Preview ${file.file_name}`}
              onClick={() => setPreviewOpen(true)}
            >
              <Eye className="size-3.5" aria-hidden="true" />
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            title="Download"
            aria-label={`Download ${file.file_name}`}
            onClick={handleDownload}
          >
            <Download className="size-3.5" aria-hidden="true" />
          </Button>
        </span>
        {meta ??
          (typeof file.size === 'number' ? (
            <span className="text-muted-foreground text-xs">
              {formatFileSize(file.size)}
              {file.created_at
                ? ` · ${new Date(file.created_at).toLocaleString()}`
                : ''}
            </span>
          ) : null)}
      </div>
      <PrivateFilePreviewDialog
        file={{
          url: file.url,
          fileName: file.file_name,
          mimeType: file.mime_type,
          expiresAt: file.expires_at,
        }}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </>
  );
}
