import { Upload } from "lucide-react"
import { useCallback, useState } from "react"
import { useDropzone, type Accept } from "react-dropzone"

import { cn } from "@/lib/utils"

import { FileAttachmentItem } from "./file-attachment-item"
import { FilePreviewDialog } from "./file-preview-dialog"
import {
  DEFAULT_DOCUMENT_ACCEPT,
  formatFileSize,
  getAcceptedFileLabel,
} from "./utils"

export type FileDropzoneProps = {
  files: File[]
  onChange: (files: File[]) => void
  accept?: Accept
  maxFiles?: number
  maxSize?: number
  multiple?: boolean
  disabled?: boolean
  helperText?: string
  showPreview?: boolean
  className?: string
}

const DEFAULT_MAX_FILES = 10
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024

export function FileDropzone({
  files,
  onChange,
  accept = DEFAULT_DOCUMENT_ACCEPT,
  maxFiles = DEFAULT_MAX_FILES,
  maxSize = DEFAULT_MAX_SIZE,
  multiple = true,
  disabled = false,
  helperText,
  showPreview = true,
  className,
}: FileDropzoneProps) {
  const [previewAttachment, setPreviewAttachment] = useState<File | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const isFull = files.length >= maxFiles
  const isDisabled = disabled || isFull

  const onDrop = useCallback(
    (accepted: File[]) => {
      const remainingSlots = maxFiles - files.length
      if (remainingSlots <= 0) return

      onChange([...files, ...accepted.slice(0, remainingSlots)])
    },
    [files, maxFiles, onChange],
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      multiple,
      accept,
      maxSize,
      disabled: isDisabled,
    })

  const removeFile = (index: number) => {
    onChange(files.filter((_, fileIndex) => fileIndex !== index))
  }

  const openPreview = (file: File) => {
    setPreviewAttachment(file)
    setPreviewOpen(true)
  }

  const acceptedLabel = getAcceptedFileLabel(
    accept as Record<string, string[]>,
  )
  const rejectionMessage = fileRejections[0]?.errors[0]?.message

  return (
    <div className={cn("space-y-3", className)}>
      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <FileAttachmentItem
              key={`${file.name}-${file.lastModified}-${index}`}
              attachment={file}
              showPreview={showPreview}
              onPreview={() => openPreview(file)}
              onRemove={() => removeFile(index)}
            />
          ))}
        </ul>
      ) : null}

      <div
        {...getRootProps()}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
          isDisabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50/40 opacity-60"
            : "cursor-pointer",
          !isDisabled &&
            (isDragActive
              ? "border-primary bg-primary/5"
              : "border-slate-200 hover:border-primary/40 hover:bg-slate-50/80"),
        )}
      >
        <input {...getInputProps()} />
        <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
          <Upload className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {isDragActive ? "Drop files here" : "Click or drag files to upload"}
          </p>
          <p className="text-muted-foreground text-xs">
            {helperText ??
              `${acceptedLabel} up to ${formatFileSize(maxSize)} each`}
          </p>
          <p className="text-muted-foreground text-xs">
            {files.length}/{maxFiles} files added
          </p>
        </div>
      </div>

      {rejectionMessage ? (
        <p className="text-destructive text-xs">{rejectionMessage}</p>
      ) : null}

      <FilePreviewDialog
        attachment={previewAttachment}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  )
}
