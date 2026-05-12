import { Button } from '@repo/ui/components/button';
import { ScrollArea } from '@repo/ui/components/scroll-area';
import { Textarea } from '@repo/ui/components/textarea';
import { toast } from '@repo/ui/exports';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Send } from 'lucide-react';
import * as React from 'react';

import { LoadingIndicator } from './-loading-indicator.tsx';
import { fetchApplicationMessages } from './-lib/api/fetchApplicationMessages.ts';
import { postApplicationMessage } from './-lib/api/postApplicationMessage.ts';
import type { DRSApplicationMessageRow } from './-lib/types/applications.ts';

const POLL_INTERVAL_MS = 5_000;

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
  const [draft, setDraft] = React.useState('');
  const scrollAreaWrapperRef = React.useRef<HTMLDivElement>(null);

  const messagesQuery = useQuery({
    queryKey: applicationMessagesQueryKey(applicationId),
    queryFn: () =>
      fetchApplicationMessages(applicationId, { page: 1, perPage: 100 }),
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const postMessageMutation = useMutation({
    mutationFn: (body: string) => postApplicationMessage(applicationId, body),
    onSuccess: () => {
      setDraft('');
      void queryClient.invalidateQueries({
        queryKey: applicationMessagesQueryKey(applicationId),
      });
    },
    onError: () => {
      toast.error('Failed to send message.');
    },
  });

  const messages = messagesQuery.data?.rows ?? [];

  const lastMessageId = messages[messages.length - 1]?.id ?? null;
  React.useEffect(() => {
    const wrapper = scrollAreaWrapperRef.current;
    if (!wrapper) return;
    const viewport = wrapper.querySelector(
      '[data-slot="scroll-area-viewport"]',
    ) as HTMLDivElement | null;
    if (!viewport) return;
    viewport.scrollTop = viewport.scrollHeight;
  }, [lastMessageId]);

  const handleSend = React.useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed || postMessageMutation.isPending) return;
    postMessageMutation.mutate(trimmed);
  }, [draft, postMessageMutation]);

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
      <div ref={scrollAreaWrapperRef}>
        <ScrollArea className="h-64 rounded-md border p-3">
          <div className="space-y-3 pr-2">
            {messagesQuery.isLoading ? (
              <LoadingIndicator label="Loading messages…" size="xs" />
            ) : messages.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                {viewerRole === 'student'
                  ? 'No messages yet. Say hello below.'
                  : 'No messages yet. Reply to the student below.'}
              </p>
            ) : (
              messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  viewerRole={viewerRole}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={
            viewerRole === 'student'
              ? 'Write a message…'
              : 'Reply to the student…'
          }
          className="min-h-[80px] flex-1"
        />
        <Button
          type="button"
          disabled={!draft.trim() || postMessageMutation.isPending}
          className="shrink-0 gap-1 sm:self-stretch"
          onClick={handleSend}
        >
          <Send className="h-4 w-4" />
          Send
        </Button>
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

  return (
    <div className={isMine ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={
          isMine
            ? 'bg-primary text-primary-foreground max-w-[85%] rounded-lg rounded-tr-none px-3 py-2 text-left'
            : 'bg-muted max-w-[85%] rounded-lg rounded-tl-none px-3 py-2 text-left'
        }
      >
        <p className="whitespace-pre-wrap break-words text-sm">
          {message.body}
        </p>
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
  );
}
