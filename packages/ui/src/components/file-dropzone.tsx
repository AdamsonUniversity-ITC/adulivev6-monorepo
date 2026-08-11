"use client";

import { AlertCircle, CheckCircle2, FileUp, Trash2 } from "lucide-react";
import * as React from "react";
import { type Accept, type FileRejection, useDropzone } from "react-dropzone";

import { Button } from "./button";
import { Progress } from "./progress";
import { cn } from "../lib/utils";

export type PreuploadedFile = {
  id: string;
  original_name: string;
  mime_type: string | null;
  size: number;
  expires_at?: string | null;
};

type UploadState = {
  key: string;
  fileName: string;
  size: number;
  progress: number;
  status: "uploading" | "uploaded" | "failed";
  error?: string;
  upload?: PreuploadedFile;
};

export type FileDropzoneProps = {
  value: PreuploadedFile[];
  onChange: (uploads: PreuploadedFile[]) => void;
  uploadFile: (
    file: File,
    onProgress: (progress: number) => void,
  ) => Promise<PreuploadedFile>;
  deleteFile?: (id: string) => Promise<void>;
  accept?: Accept;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  label?: string;
  description?: string | null;
  required?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
  className?: string;
};

function uploadStateKey(file: File): string {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${file.name}-${file.lastModified}-${random}`;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function FileDropzone({
  value,
  onChange,
  uploadFile,
  deleteFile,
  accept,
  maxFiles = 1,
  maxSize,
  disabled = false,
  label = "Attachments",
  description,
  required = false,
  onUploadingChange,
  className,
}: FileDropzoneProps) {
  const [states, setStates] = React.useState<UploadState[]>([]);
  const valueRef = React.useRef(value);
  const uploadCount =
    value.length + states.filter((s) => s.status === "uploading").length;
  const remainingSlots = Math.max(maxFiles - uploadCount, 0);
  const isUploading = states.some((s) => s.status === "uploading");

  React.useEffect(() => {
    valueRef.current = value;
  }, [value]);

  React.useEffect(() => {
    onUploadingChange?.(isUploading);
  }, [isUploading, onUploadingChange]);

  const onDropRejected = React.useCallback((rejections: FileRejection[]) => {
    const next = rejections.map((rejection) => ({
      key: `${rejection.file.name}-${rejection.file.lastModified}-rejected`,
      fileName: rejection.file.name,
      size: rejection.file.size,
      progress: 0,
      status: "failed" as const,
      error: rejection.errors[0]?.message ?? "This file cannot be uploaded.",
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
            status: "uploading",
          },
        ]);

        uploadFile(file, (progress) => {
          setStates((prev) =>
            prev.map((state) =>
              state.key === key ? { ...state, progress } : state,
            ),
          );
        })
          .then((uploaded) => {
            const next = [...valueRef.current, uploaded].slice(0, maxFiles);
            valueRef.current = next;
            onChange(next);
            setStates((prev) =>
              prev.map((state) =>
                state.key === key
                  ? {
                      ...state,
                      progress: 100,
                      status: "uploaded",
                      upload: uploaded,
                    }
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
                      status: "failed",
                      error: "Upload failed. Try again.",
                    }
                  : state,
              ),
            );
          });
      });
    },
    [maxFiles, onChange, remainingSlots, uploadFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    disabled: disabled || remainingSlots === 0,
    maxFiles: remainingSlots || 1,
    maxSize,
    onDrop,
    onDropRejected,
  });

  const removeUpload = (upload: PreuploadedFile) => {
    onChange(value.filter((item) => item.id !== upload.id));
    void deleteFile?.(upload.id).catch(() => undefined);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div>
        <p className="text-sm font-medium">
          {label}{" "}
          <span
            className={required ? "text-destructive" : "text-muted-foreground"}
          >
            {required ? "required" : "optional"}
          </span>
        </p>
        {description ? (
          <p className="text-muted-foreground text-xs">{description}</p>
        ) : null}
      </div>

      <div
        {...getRootProps({
          "aria-label": `${label} upload area`,
        })}
        className={cn(
          "border-border bg-muted/20 cursor-pointer rounded-md border border-dashed p-4 text-center transition-colors",
          isDragActive && "border-primary bg-primary/5",
          (disabled || remainingSlots === 0) && "cursor-not-allowed opacity-60",
        )}
      >
        <input {...getInputProps()} />
        <FileUp
          className="text-muted-foreground mx-auto h-6 w-6"
          aria-hidden="true"
        />
        <p className="mt-2 text-sm font-medium">
          {remainingSlots === 0
            ? "Maximum files uploaded"
            : "Click or drag files to upload"}
        </p>
        <p className="text-muted-foreground text-xs">
          {maxFiles > 1 ? `Up to ${maxFiles} files` : "One file"}
          {maxSize ? `, max ${formatFileSize(maxSize)}` : ""}
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
                className="h-4 w-4 text-green-600"
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
            .filter((state) => state.status !== "uploaded")
            .map((state) => (
              <div
                key={state.key}
                className="border-border rounded-md border p-2"
              >
                <div className="flex items-center gap-2">
                  {state.status === "failed" ? (
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
                {state.status === "uploading" ? (
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
