import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import { Progress } from '@repo/ui/components/progress';
import { ScrollArea } from '@repo/ui/components/scroll-area';
import { Textarea } from '@repo/ui/components/textarea';
import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  FileUp,
  Paperclip,
  Send,
  Trash2,
} from 'lucide-react';
import * as React from 'react';
import { type FileRejection, useDropzone } from 'react-dropzone';

import { getAvatarUrlByType } from '@/lib/avatar.ts';
import { handlePrivateFileDownloadClick } from '@/lib/downloadPrivateFile.ts';
import { formatExpiryTime } from '@/lib/formatExpiryTime.ts';
import {
  deleteTempUpload,
  formatFileSize,
  type TempUpload,
  uploadTempFile,
} from '@/lib/tempUploads.ts';
import { fetchApplicationMessages } from './-lib/api/fetchApplicationMessages.ts';
import { postApplicationMessage } from './-lib/api/postApplicationMessage.ts';
import type { DRSApplicationMessageRow } from './-lib/types/applications.ts';
import { LoadingIndicator } from './-loading-indicator.tsx';

const POLL_INTERVAL_MS = 5_000;
const MAX_MESSAGE_ATTACHMENTS = 5;
const MAX_MESSAGE_ATTACHMENT_BYTES = 20 * 1024 * 1024;
type ComposerUploadState = {
  key: string;
  fileName: string;
  size: number;
  progress: number;
  status: 'uploading' | 'uploaded' | 'failed';
  error?: string;
};

function uploadStateKey(file: File): string {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${file.name}-${file.lastModified}-${random}`;
}

function messagesViewportFor(
  wrapper: HTMLDivElement | null,
): HTMLDivElement | null {
  if (!wrapper) return null;

  return wrapper.querySelector(
    '[data-slot="scroll-area-viewport"]',
  ) as HTMLDivElement | null;
}

function isNearBottom(viewport: HTMLDivElement): boolean {
  return (
    viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 48
  );
}

export type ApplicationMessagesPanelProps = {
  applicationId: string;
  /**
   * Determines which side of the bubble row the current viewer's messages
   * render on. Student viewers send as the application owner (is_registrar
   * === false); staff viewers send on the registrar side.
   */
  viewerRole: 'student' | 'staff';
  /** Optional vertical height of the message scroll area. */
  className?: string;
};

export function applicationMessagesQueryKey(applicationId: string) {
  return ['drs-application-messages', applicationId] as const;
}

export function ApplicationMessagesPanel({
  applicationId,
  viewerRole,
  className,
}: ApplicationMessagesPanelProps) {
  const queryClient = useQueryClient();
  const composerId = React.useId();
  const composerHelpId = React.useId();
  const composerErrorId = React.useId();
  const [draft, setDraft] = React.useState('');
  const [attachments, setAttachments] = React.useState<TempUpload[]>([]);
  const [uploadStates, setUploadStates] = React.useState<ComposerUploadState[]>(
    [],
  );
  const scrollAreaWrapperRef = React.useRef<HTMLDivElement>(null);
  const attachmentsRef = React.useRef(attachments);
  const shouldStickToBottomRef = React.useRef(true);
  const forceNextScrollRef = React.useRef(false);

  React.useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  const messagesQuery = useQuery({
    queryKey: applicationMessagesQueryKey(applicationId),
    queryFn: () =>
      fetchApplicationMessages(applicationId, { page: 1, perPage: 100 }),
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const postMessageMutation = useMutation({
    mutationFn: (payload: {
      body?: string;
      temp_upload_ids?: Array<string | number>;
    }) => postApplicationMessage(applicationId, payload),
    onSuccess: () => {
      forceNextScrollRef.current = true;
      setDraft('');
      setAttachments([]);
      setUploadStates([]);
      void queryClient.invalidateQueries({
        queryKey: applicationMessagesQueryKey(applicationId),
      });
    },
    onError: () => {
      toast.error('Failed to send message.');
    },
  });

  const isUploading = uploadStates.some(
    (state) => state.status === 'uploading',
  );
  const uploadCount =
    attachments.length +
    uploadStates.filter((state) => state.status === 'uploading').length;
  const remainingAttachmentSlots = Math.max(
    MAX_MESSAGE_ATTACHMENTS - uploadCount,
    0,
  );
  const canSend =
    (draft.trim() !== '' || attachments.length > 0) &&
    !isUploading &&
    !postMessageMutation.isPending;

  const messages = messagesQuery.data?.rows ?? [];

  React.useEffect(() => {
    shouldStickToBottomRef.current = true;
    forceNextScrollRef.current = true;
  }, [applicationId]);

  React.useEffect(() => {
    const viewport = messagesViewportFor(scrollAreaWrapperRef.current);
    if (!viewport) return;

    const updateScrollIntent = () => {
      shouldStickToBottomRef.current = isNearBottom(viewport);
    };

    updateScrollIntent();
    viewport.addEventListener('scroll', updateScrollIntent, { passive: true });

    return () => {
      viewport.removeEventListener('scroll', updateScrollIntent);
    };
  }, []);

  const lastMessageId = messages[messages.length - 1]?.id ?? null;
  React.useEffect(() => {
    const viewport = messagesViewportFor(scrollAreaWrapperRef.current);
    if (!viewport) return;

    if (!forceNextScrollRef.current && !shouldStickToBottomRef.current) {
      return;
    }

    requestAnimationFrame(() => {
      viewport.scrollTop = viewport.scrollHeight;
      shouldStickToBottomRef.current = true;
      forceNextScrollRef.current = false;
    });
  }, [lastMessageId]);

  const handleDraftChange = React.useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (postMessageMutation.isError) {
        postMessageMutation.reset();
      }
      setDraft(event.target.value);
    },
    [postMessageMutation],
  );

  const handleSend = React.useCallback(() => {
    const trimmed = draft.trim();
    if (!canSend) return;
    forceNextScrollRef.current = true;
    postMessageMutation.mutate({
      body: trimmed || undefined,
      temp_upload_ids: attachments.map((upload) => upload.id),
    });
  }, [attachments, canSend, draft, postMessageMutation]);

  const onDropRejected = React.useCallback((rejections: FileRejection[]) => {
    const next = rejections.map((rejection) => ({
      key: `${rejection.file.name}-${rejection.file.lastModified}-rejected`,
      fileName: rejection.file.name,
      size: rejection.file.size,
      progress: 0,
      status: 'failed' as const,
      error: rejection.errors[0]?.message ?? 'This file cannot be uploaded.',
    }));
    setUploadStates((prev) => [...next, ...prev]);
  }, []);

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.slice(0, remainingAttachmentSlots).forEach((file) => {
        const key = uploadStateKey(file);
        setUploadStates((prev) => [
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
          setUploadStates((prev) =>
            prev.map((state) =>
              state.key === key ? { ...state, progress } : state,
            ),
          );
        })
          .then((tempUpload) => {
            setAttachments((prev) => {
              const next = [...prev, tempUpload].slice(
                0,
                MAX_MESSAGE_ATTACHMENTS,
              );
              attachmentsRef.current = next;
              return next;
            });
            setUploadStates((prev) =>
              prev.map((state) =>
                state.key === key
                  ? { ...state, progress: 100, status: 'uploaded' }
                  : state,
              ),
            );
          })
          .catch(() => {
            setUploadStates((prev) =>
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
    [remainingAttachmentSlots],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    disabled: postMessageMutation.isPending || remainingAttachmentSlots === 0,
    maxFiles: remainingAttachmentSlots || 1,
    maxSize: MAX_MESSAGE_ATTACHMENT_BYTES,
    onDrop,
    onDropRejected,
  });

  const removeAttachment = React.useCallback((upload: TempUpload) => {
    setAttachments((prev) => {
      const next = prev.filter((item) => item.id !== upload.id);
      attachmentsRef.current = next;
      return next;
    });
    void deleteTempUpload(upload.id).catch(() => undefined);
  }, []);

  const dismissUploadState = React.useCallback((key: string) => {
    setUploadStates((prev) => prev.filter((state) => state.key !== key));
  }, []);

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className={className ?? 'space-y-3'}>
      <div ref={scrollAreaWrapperRef} className="max-w-full overflow-hidden">
        <ScrollArea className="h-64 max-w-full rounded-md border p-3">
          <div
            className="space-y-3 pr-2"
            role="log"
            aria-label="Application messages"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {messagesQuery.isLoading ? (
              <LoadingIndicator label="Loading messages…" size="xs" />
            ) : messagesQuery.isError ? (
              <div className="space-y-2 text-xs">
                <p className="text-destructive">
                  Could not load messages right now.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void messagesQuery.refetch()}
                >
                  Retry
                </Button>
              </div>
            ) : messages.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                {viewerRole === 'student'
                  ? 'No messages yet. Say hello below.'
                  : 'No messages yet. Reply to the student below.'}
              </p>
            ) : (
              messages.map((m) => (
                <MessageBubble key={m.id} message={m} viewerRole={viewerRole} />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="max-w-full space-y-2 overflow-hidden rounded-md border p-2">
        <label htmlFor={composerId} className="sr-only">
          {viewerRole === 'student'
            ? 'Message the registrar'
            : 'Reply to the student'}
        </label>
        <Textarea
          id={composerId}
          value={draft}
          onChange={handleDraftChange}
          onKeyDown={onKeyDown}
          placeholder={
            viewerRole === 'student'
              ? 'Write a message…'
              : 'Reply to the student…'
          }
          aria-describedby={
            postMessageMutation.isError
              ? `${composerHelpId} ${composerErrorId}`
              : composerHelpId
          }
          className="min-h-[80px] resize-none border-0 p-1 shadow-none focus-visible:ring-0"
        />
        <p id={composerHelpId} className="sr-only">
          Press Enter to send, or Shift and Enter to add a new line.
        </p>
        {attachments.length > 0 ||
        uploadStates.some((state) => state.status !== 'uploaded') ? (
          <div className="space-y-2" aria-live="polite">
            {attachments.map((upload) => (
              <div
                key={upload.id}
                className="border-border bg-muted/20 flex items-center gap-2 rounded-md border p-2"
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={postMessageMutation.isPending}
                  aria-label={`Remove ${upload.original_name}`}
                  onClick={() => removeAttachment(upload)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            ))}

            {uploadStates
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
                    {state.status === 'failed' ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissUploadState(state.key)}
                      >
                        Dismiss
                      </Button>
                    ) : null}
                  </div>
                  {state.status === 'uploading' ? (
                    <div role="status" aria-live="polite">
                      <Progress value={state.progress} className="mt-2 h-1" />
                      <span className="sr-only">
                        Uploading {state.fileName}, {Math.round(state.progress)}
                        % complete.
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
        {postMessageMutation.isError ? (
          <p
            id={composerErrorId}
            className="text-destructive text-xs"
            role="alert"
          >
            Message was not sent. Check your connection, then try sending again.
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div
              {...getRootProps()}
              className={[
                'border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm transition-colors',
                isDragActive ? 'border-primary bg-primary/5' : '',
                postMessageMutation.isPending || remainingAttachmentSlots === 0
                  ? 'cursor-not-allowed opacity-60'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <input {...getInputProps()} />
              <Paperclip className="h-4 w-4" aria-hidden="true" />
              {remainingAttachmentSlots === 0
                ? 'Attachment limit reached'
                : 'Attach files'}
            </div>
            <p className="text-muted-foreground text-xs">
              Up to {MAX_MESSAGE_ATTACHMENTS} files, max{' '}
              {formatFileSize(MAX_MESSAGE_ATTACHMENT_BYTES)} each
            </p>
          </div>
          <Button
            type="button"
            disabled={!canSend}
            className="shrink-0 gap-1"
            onClick={handleSend}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            {postMessageMutation.isPending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}

type MessageBubbleProps = {
  message: DRSApplicationMessageRow;
  viewerRole: 'student' | 'staff';
};

function MessageBubble({ message, viewerRole }: MessageBubbleProps) {
  // is_registrar === true means the message was sent by a non-owner (staff
  // participant). Whether that bubble is "mine" depends on the viewer.
  const isMine =
    viewerRole === 'staff' ? message.is_registrar : !message.is_registrar;
  const senderName =
    message.sender?.first_name?.trim() ||
    message.sender?.name?.trim() ||
    (message.is_registrar ? 'Staff' : 'Student');
  const avatarUrl = getAvatarUrlByType(
    message.sender?.avatar_type,
    message.sender?.avatar_id,
  );
  const attachments = message.attachments ?? [];
  const hasBody = message.body.trim() !== '';

  return (
    <div
      className={
        isMine
          ? 'flex min-w-0 flex-row-reverse items-end gap-2'
          : 'flex min-w-0 items-end gap-2'
      }
    >
      <Avatar className="h-8 w-8 shrink-0">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={senderName} /> : null}
        <AvatarFallback>{initialsForName(senderName)}</AvatarFallback>
      </Avatar>
      <div
        className={
          isMine
            ? 'max-w-[min(34rem,85%)] min-w-0 text-right'
            : 'max-w-[min(34rem,85%)] min-w-0'
        }
      >
        <p className="text-muted-foreground mb-1 text-xs">{senderName}</p>
        <div
          className={
            isMine
              ? 'bg-primary text-primary-foreground max-w-full overflow-hidden rounded-lg rounded-tr-none px-3 py-2 text-left wrap-anywhere'
              : 'bg-muted max-w-full overflow-hidden rounded-lg rounded-tl-none px-3 py-2 text-left wrap-anywhere'
          }
        >
          {hasBody ? (
            <p className="text-sm wrap-anywhere whitespace-pre-wrap">
              {message.body}
            </p>
          ) : null}
          {attachments.length > 0 ? (
            <div className={hasBody ? 'mt-2 space-y-1' : 'space-y-1'}>
              {attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  rel="noreferrer"
                  className={
                    isMine
                      ? 'border-primary-foreground/30 bg-primary-foreground/10 hover:bg-primary-foreground/15 text-primary-foreground flex max-w-full min-w-0 items-center gap-2 overflow-hidden rounded-md border px-2 py-1.5 text-xs transition-colors'
                      : 'border-border bg-background/70 text-foreground hover:bg-background flex max-w-full min-w-0 items-center gap-2 overflow-hidden rounded-md border px-2 py-1.5 text-xs transition-colors'
                  }
                  onClick={(event) =>
                    handlePrivateFileDownloadClick(
                      event,
                      attachment.url,
                      attachment.file_name,
                      attachment.expires_at,
                      () => {
                        toast.error(
                          'Failed to download attachment. Please refresh and try again.',
                        );
                      },
                    )
                  }
                >
                  <FileUp className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block wrap-anywhere">
                      {attachment.file_name}
                    </span>
                    <span className="block truncate opacity-75">
                      Private download
                      {attachment.expires_at
                        ? ` - expires ${formatExpiryTime(attachment.expires_at)}`
                        : ''}
                    </span>
                  </span>
                  <span className="shrink-0 opacity-75">
                    {formatFileSize(attachment.size)}
                  </span>
                </a>
              ))}
            </div>
          ) : null}
          <p
            className={
              isMine
                ? 'mt-1 text-[10px] opacity-80'
                : 'text-muted-foreground mt-1 text-[10px]'
            }
          >
            {message.created_at
              ? new Date(message.created_at).toLocaleString()
              : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

function initialsForName(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return initials || 'U';
}
