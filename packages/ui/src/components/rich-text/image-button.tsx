import { ImagePlus, Loader2, Upload } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '../button';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip';
import { useEditorContext } from './editor-context';

const IMAGE_ACCEPT = {
  'image/*': [],
} as const;

export function ImageButton() {
  const { insertUploadedImage, showImageButton } = useEditorContext();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        await insertUploadedImage(file);
        setOpen(false);
      } catch {
        // host handles error reporting
      } finally {
        setUploading(false);
      }
    },
    [insertUploadedImage],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: IMAGE_ACCEPT,
    maxFiles: 1,
    multiple: false,
    disabled: uploading,
    noClick: uploading,
    noKeyboard: true,
    onDropAccepted: (files) => {
      const file = files[0];
      if (file) void handleFile(file);
    },
  });

  if (!showImageButton) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-none"
              aria-label="Insert image"
              type="button"
            >
              <ImagePlus className="size-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Insert image</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-64 p-3" align="start">
        {uploading ? (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-muted-foreground text-sm">Uploading...</span>
          </div>
        ) : (
          <section
            {...getRootProps()}
            className="border-border hover:border-foreground/50 data-[drag-active=true]:border-primary data-[drag-active=true]:bg-muted/50 flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed p-6 transition-colors"
            data-drag-active={isDragActive}
          >
            <input {...getInputProps()} />
            <Upload className="text-muted-foreground size-6" />
            <span className="text-sm font-medium">Upload image</span>
            <span className="text-muted-foreground text-xs">
              Click or drag and drop
            </span>
          </section>
        )}
      </PopoverContent>
    </Popover>
  );
}
