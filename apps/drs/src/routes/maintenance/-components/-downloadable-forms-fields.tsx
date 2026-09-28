import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { toast } from '@repo/ui/exports';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

import {
  type DownloadableForm,
  deleteDownloadableForm,
  uploadDownloadableForm,
} from '../-lib/api/downloadableForms.ts';

type Props = {
  documentId: string | number;
  forms: DownloadableForm[];
  disabled?: boolean;
};

function formatBytes(size: number): string {
  if (!Number.isFinite(size) || size <= 0) return '0 B';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function DownloadableFormsFields({
  documentId,
  forms,
  disabled = false,
}: Props) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingName, setPendingName] = useState<string | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['document_detail', documentId] });
  };

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadDownloadableForm(documentId, file),
    onSuccess: () => {
      toast.success('Form uploaded.');
      setPendingName(null);
      invalidate();
    },
    onError: () => {
      toast.error('Failed to upload form.');
      setPendingName(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (mediaId: string | number) =>
      deleteDownloadableForm(documentId, mediaId),
    onSuccess: () => {
      toast.success('Form removed.');
      invalidate();
    },
    onError: () => toast.error('Failed to remove form.'),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Downloadable forms</p>
          <p className="text-muted-foreground text-xs">
            Blank forms students can download when requesting this document.
          </p>
        </div>
        <div>
          <Input
            ref={inputRef}
            type="file"
            className="hidden"
            disabled={disabled || uploadMutation.isPending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (!file) return;
              setPendingName(file.name);
              uploadMutation.mutate(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || uploadMutation.isPending}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {uploadMutation.isPending ? 'Uploading…' : 'Upload form'}
          </Button>
        </div>
      </div>

      {pendingName ? (
        <p className="text-muted-foreground text-xs">Uploading {pendingName}…</p>
      ) : null}

      {forms.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
          No downloadable forms uploaded yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {forms.map((form) => (
            <li
              key={form.id}
              className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <a
                  href={form.download_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary truncate font-medium underline-offset-2 hover:underline"
                >
                  {form.file_name || form.name}
                </a>
                <p className="text-muted-foreground text-xs">
                  {formatBytes(form.size)}
                  {form.mime_type ? ` · ${form.mime_type}` : ''}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(form.id)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
