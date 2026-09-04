import { Button } from '@repo/ui/components/button';
import { Progress } from '@repo/ui/components/progress';
import { AlertCircle, CheckCircle2, FileUp, Trash2 } from 'lucide-react';
import * as React from 'react';
import { type FileRejection, useDropzone } from 'react-dropzone';

import {
  deleteTempUpload,
  formatFileSize,
  type TempUpload,
  uploadTempFile,
} from '@/lib/tempUploads.ts';

type UploadState = {
  key: string;
  fileName: string;
  size: number;
  progress: number;
  status: 'uploading' | 'uploaded' | 'failed';
  error?: string;
  tempUpload?: TempUpload;
};

type Props = {
  label: string;
  description?: string | null;
  required?: boolean;
  value: TempUpload[];
  onChange: (uploads: TempUpload[]) => void;
  maxFiles?: number;
  maxSizeKb?: number | null;
  allowedMimeTypes?: string[] | null;
  disabled?: boolean;
};

function uploadStateKey(file: File): string {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${file.name}-${file.lastModified}-${random}`;
}

export function SupportingDocumentDropzone({
  label,
  description,
  required = false,
  value,
  onChange,
  maxFiles = 1,
  maxSizeKb,
  allowedMimeTypes,
  disabled = false,
}: Props) {
  const [states, setStates] = React.useState<UploadState[]>([]);
  const valueRef = React.useRef(value);
  const uploadCount =
    value.length + states.filter((s) => s.status === 'uploading').length;
  const remainingSlots = Math.max(maxFiles - uploadCount, 0);

  React.useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const onDropRejected = React.useCallback((rejections: FileRejection[]) => {
    const next = rejections.map((rejection) => ({
      key: `${rejection.file.name}-${rejection.file.lastModified}-rejected`,
      fileName: rejection.file.name,
      size: rejection.file.size,
      progress: 0,
      status: 'failed' as const,
      error: rejection.errors[0]?.message ?? 'This file cannot be uploaded.',
    }));
    setStates((prev) => [...next, ...prev]);
  }, []);

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.slice(0, remainingSlots).forEach((file) => {
        const key = uploadStateKey(file);
        setStates((prev) => [
          ...prev,
          {
            key,
            fileName: file.name,
            size: file.size,
            progress: 0,
            status: 'uploading',
          },
        ]);

        uploadTempFile(file, (progress) => {
          setStates((prev) =>
            prev.map((state) =>
              state.key === key ? { ...state, progress } : state,
            ),
          );
        })
          .then((tempUpload) => {
            const next = [...valueRef.current, tempUpload].slice(0, maxFiles);
            valueRef.current = next;
            onChange(next);
            setStates((prev) =>
              prev.map((state) =>
                state.key === key
                  ? { ...state, progress: 100, status: 'uploaded', tempUpload }
                  : state,
              ),
            );
          })
          .catch(() => {
            setStates((prev) =>
              prev.map((state) =>
                state.key === key
                  ? {
                      ...state,
                      status: 'failed',
                      error: 'Upload failed. Try again.',
                    }
                  : state,
              ),
            );
          });
      });
    },
    [maxFiles, onChange, remainingSlots],
  );

  const accept = React.useMemo(() => {
    if (!allowedMimeTypes || allowedMimeTypes.length === 0) {
      return undefined;
    }

    return allowedMimeTypes.reduce<Record<string, string[]>>((acc, type) => {
      acc[type] = [];
      return acc;
    }, {});
  }, [allowedMimeTypes]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    disabled: disabled || remainingSlots === 0,
    maxFiles: remainingSlots || 1,
    maxSize: maxSizeKb ? maxSizeKb * 1024 : undefined,
    onDrop,
    onDropRejected,
  });

  const removeUpload = (upload: TempUpload) => {
    onChange(value.filter((item) => item.id !== upload.id));
    void deleteTempUpload(upload.id).catch(() => undefined);
  };

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium">
          {label}{' '}
          <span
            className={required ? 'text-destructive' : 'text-muted-foreground'}
          >
            {required ? 'required' : 'optional'}
          </span>
        </p>
        {description ? (
          <p className="text-muted-foreground text-xs">{description}</p>
        ) : null}
      </div>

      <div
        {...getRootProps({
          'aria-label': `${label} upload area`,
        })}
        className={[
          'border-border bg-muted/20 cursor-pointer rounded-md border border-dashed p-4 text-center transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : '',
          disabled || remainingSlots === 0
            ? 'cursor-not-allowed opacity-60'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <input {...getInputProps()} />
        <FileUp
          className="text-muted-foreground mx-auto h-6 w-6"
          aria-hidden="true"
        />
        <p className="mt-2 text-sm font-medium">
          {remainingSlots === 0
            ? 'Maximum files uploaded'
            : 'Click or drag files to upload'}
        </p>
        <p className="text-muted-foreground text-xs">
          {maxFiles > 1 ? `Up to ${maxFiles} files` : 'One file'}
          {maxSizeKb ? `, max ${formatFileSize(maxSizeKb * 1024)}` : ''}
        </p>
      </div>

      {value.length > 0 || states.length > 0 ? (
        <div className="space-y-2" aria-live="polite">
          {value.map((upload) => (
            <div
              key={upload.id}
              className="border-border flex items-center gap-2 rounded-md border p-2"
            >
              <CheckCircle2
                className="text-status-success size-4"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{upload.original_name}</p>
                <p className="text-muted-foreground text-xs">
                  {formatFileSize(upload.size)}
                </p>
              </div>
              {!disabled ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove ${upload.original_name}`}
                  onClick={() => removeUpload(upload)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : null}
            </div>
          ))}

          {states
            .filter((state) => state.status !== 'uploaded')
            .map((state) => (
              <div
                key={state.key}
                className="border-border rounded-md border p-2"
              >
                <div className="flex items-center gap-2">
                  {state.status === 'failed' ? (
                    <AlertCircle
                      className="text-destructive h-4 w-4"
                      aria-hidden="true"
                    />
                  ) : (
                    <FileUp
                      className="text-muted-foreground h-4 w-4"
                      aria-hidden="true"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{state.fileName}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatFileSize(state.size)}
                    </p>
                  </div>
                </div>
                {state.status === 'uploading' ? (
                  <div role="status" aria-live="polite">
                    <Progress value={state.progress} className="mt-2 h-1" />
                    <span className="sr-only">
                      Uploading {state.fileName}, {Math.round(state.progress)}%
                      complete.
                    </span>
                  </div>
                ) : (
                  <p className="text-destructive mt-1 text-xs" role="alert">
                    {state.error}
                  </p>
                )}
              </div>
            ))}
        </div>
      ) : null}
    </div>
  );
}
