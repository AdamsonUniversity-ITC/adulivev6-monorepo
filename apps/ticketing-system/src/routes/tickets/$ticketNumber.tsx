import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addWatcher,
  assignTicket,
  changeTicketCategory,
  changeTicketPriority,
  changeTicketStatus,
  downloadTicketAttachment,
  extractMentionIdsFromBody,
  fetchCurrentBoard,
  fetchTicket,
  heartbeatTicketPresence,
  type PresencePeer,
  removeWatcher,
  sendTicketMessage,
  submitCsat,
  type TicketAttachment,
  type TicketMessage,
  transferTicketSection,
  type BoardTemplate,
} from "@/lib/aduts-api";
import {
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Paperclip, Send, X } from "lucide-react";
import { toast } from "@repo/ui/exports";
import {
  RichTextEditor,
  sanitizeRichTextHtml,
} from "@repo/ui/components/rich-text-editor";
import { deleteTempUpload, uploadTempFile } from "@/lib/temp-uploads";

import { AccessDeniedState } from "@/components/access-denied-state";
import { LoadingState } from "@/components/loading-state";
import { NotFoundState } from "@/components/not-found-state";
import { PersonIdentity } from "@/components/person-identity";
import {
  TICKET_ATTACHMENT_ACCEPT_ATTR,
  TICKET_ATTACHMENT_MAX_FILES,
  TICKET_ATTACHMENT_MAX_SIZE,
} from "@/components/ticket-attachment-dropzone";
import { StatusBadge } from "@/components/ticket-badges";
import { TicketChecklistCard } from "@/components/ticket-checklist-card";
import { TicketLinksCard } from "@/components/ticket-links-card";
import { getAxiosStatus } from "@/lib/axios-status";
import { authUserQueryOptions } from "@/lib/auth-queries";
import { formatPriority, formatStatus } from "@/lib/format-labels";
import {
  getPersonAvatarUrl,
  getPersonDisplayName,
  getPersonInitials,
} from "@/lib/person-display";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Label } from "@repo/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs";
import { Textarea } from "@repo/ui/components/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return dateFormatter.format(d);
}

function hasHtmlContent(html: string): boolean {
  const stripped = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
  return stripped.length > 0 || /<img\b/.test(html);
}

/* ------------------------------------------------------------------ */
/*  Route                                                             */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/tickets/$ticketNumber")({
  component: TicketDetailPage,
});

function TicketDetailPage() {
  const { ticketNumber } = Route.useParams();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [tempUploadIds, setTempUploadIds] = useState<Array<string | number>>(
    [],
  );
  const [uploading, setUploading] = useState(false);
  const [internalMessage, setInternalMessage] = useState("");
  const [internalTempUploadIds, setInternalTempUploadIds] = useState<
    Array<string | number>
  >([]);
  const [internalUploading, setInternalUploading] = useState(false);
  const [chatChannel, setChatChannel] = useState<"conversation" | "internal">(
    "conversation",
  );
  const [csatScore, setCsatScore] = useState("5");
  const [csatComment, setCsatComment] = useState("");
  const [watcherUserId, setWatcherUserId] = useState("");
  const [presencePeers, setPresencePeers] = useState<PresencePeer[]>([]);
  const [confirmStatusAction, setConfirmStatusAction] = useState<
    null | "cancel" | "resolve"
  >(null);

  useEffect(() => {
    function onChannel(event: Event) {
      const detail = (event as CustomEvent<string>).detail;
      if (detail === "conversation" || detail === "internal") {
        setChatChannel(detail);
      }
    }
    window.addEventListener("aduts:set-chat-channel", onChannel);
    return () =>
      window.removeEventListener("aduts:set-chat-channel", onChannel);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setInterval(() => void beat(), 20_000);

    async function beat() {
      if (document.visibilityState === "hidden") return;
      try {
        const peers = await heartbeatTicketPresence(ticketNumber);
        if (!cancelled) setPresencePeers(peers);
      } catch {
        /* best-effort */
      }
    }

    void beat();

    function onVisibility() {
      if (document.visibilityState === "visible") void beat();
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ticketNumber]);

  const ticketQuery = useQuery({
    queryKey: ["aduts", "ticket", ticketNumber],
    queryFn: () => fetchTicket(ticketNumber),
  });

  const authUserQuery = useQuery(authUserQueryOptions);

  const boardQuery = useQuery({
    queryKey: ["aduts", "board"],
    queryFn: fetchCurrentBoard,
    enabled: !!ticketQuery.data,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: ["aduts", "ticket", ticketNumber],
    });
  };

  const statusMutation = useMutation({
    mutationFn: (status: string) => changeTicketStatus(ticketNumber, status),
    onSuccess: () => {
      invalidate();
      toast.success("Status updated");
    },
    onError: () => toast.error("Could not update status"),
  });

  const priorityMutation = useMutation({
    mutationFn: (priority: string) =>
      changeTicketPriority(ticketNumber, priority),
    onSuccess: () => {
      invalidate();
      toast.success("Priority updated");
    },
    onError: () => toast.error("Could not update priority"),
  });

  const categoryMutation = useMutation({
    mutationFn: (categoryId: number) =>
      changeTicketCategory(ticketNumber, categoryId),
    onSuccess: () => {
      invalidate();
      toast.success("Category updated");
    },
    onError: () => toast.error("Could not update category."),
  });

  const assignMutation = useMutation({
    mutationFn: (assignedTo: number) => assignTicket(ticketNumber, assignedTo),
    onSuccess: () => {
      invalidate();
      toast.success("Assignee updated");
    },
    onError: () => toast.error("Could not assign"),
  });

  const transferMutation = useMutation({
    mutationFn: (sectionId: number) =>
      transferTicketSection(ticketNumber, sectionId),
    onSuccess: (updated) => {
      invalidate();
      toast.success(
        updated.section_name
          ? `Transferred to ${updated.section_name}`
          : "Ticket transferred",
      );
    },
    onError: () => {
      toast.error("Could not transfer this ticket.");
    },
  });

  const messageMutation = useMutation({
    mutationFn: () =>
      sendTicketMessage(ticketNumber, message, "msg", tempUploadIds),
    onSuccess: () => {
      setMessage("");
      setTempUploadIds([]);
      invalidate();
      toast.success("Reply sent");
    },
    onError: () => toast.error("Could not send reply"),
  });

  const csatMutation = useMutation({
    mutationFn: () =>
      submitCsat(ticketNumber, Number(csatScore), csatComment || undefined),
    onSuccess: () => {
      invalidate();
      toast.success("Feedback submitted");
    },
    onError: () => toast.error("Could not submit feedback"),
  });

  const addWatcherMutation = useMutation({
    mutationFn: (userId: number) => addWatcher(ticketNumber, userId),
    onSuccess: () => {
      setWatcherUserId("");
      invalidate();
      toast.success("Watcher added.");
    },
    onError: () => toast.error("Could not add watcher."),
  });

  const removeWatcherMutation = useMutation({
    mutationFn: (userId: number) => removeWatcher(ticketNumber, userId),
    onSuccess: () => {
      invalidate();
      toast.success("Watcher removed.");
    },
    onError: () => toast.error("Could not remove watcher."),
  });

  const ticket = ticketQuery.data;

  const sectionMembers = useMemo(() => {
    if (!ticket?.section_id) return [];
    const section = (boardQuery.data?.sections ?? []).find(
      (s) => s.id === ticket.section_id,
    );
    return section?.members ?? [];
  }, [boardQuery.data?.sections, ticket?.section_id]);

  const sectionCategories = useMemo(() => {
    if (!ticket?.section_id) return [];
    return (boardQuery.data?.categories ?? []).filter(
      (category) => category.section_id === ticket.section_id,
    );
  }, [boardQuery.data?.categories, ticket?.section_id]);

  const internalMessageMutation = useMutation({
    mutationFn: () => {
      const candidates = sectionMembers
        .map((m) => ({
          user_id: m.user_id,
          name: m.name?.trim() || "",
        }))
        .filter((m) => m.name);
      return sendTicketMessage(
        ticketNumber,
        internalMessage,
        "internal",
        internalTempUploadIds,
        extractMentionIdsFromBody(internalMessage, candidates),
      );
    },
    onSuccess: () => {
      setInternalMessage("");
      setInternalTempUploadIds([]);
      invalidate();
      toast.success("Internal note sent");
    },
    onError: () => toast.error("Could not send note"),
  });

  const transferSections = useMemo(() => {
    if (!ticket?.section_id) return [];
    return (boardQuery.data?.sections ?? []).filter(
      (s) => s.id !== ticket.section_id,
    );
  }, [boardQuery.data?.sections, ticket?.section_id]);

  const publicTemplates = useMemo(
    () =>
      (boardQuery.data?.templates ?? []).filter(
        (tpl) => tpl.type !== "internal",
      ),
    [boardQuery.data?.templates],
  );

  const internalTemplates = useMemo(
    () =>
      (boardQuery.data?.templates ?? []).filter(
        (tpl) => tpl.type === "internal",
      ),
    [boardQuery.data?.templates],
  );

  const watcherCandidates = useMemo(() => {
    const watchers = new Set(
      (ticket?.watchers ?? []).map((w) => Number(w.user_id)),
    );
    return sectionMembers.filter((m) => !watchers.has(m.user_id));
  }, [sectionMembers, ticket?.watchers]);

  const canManageWatchers = !!ticket?.access?.is_staff;

  /* ---------- Loading / error states ---------- */

  if (ticketQuery.isLoading) {
    return <LoadingState label="Loading ticket…" />;
  }

  if (ticketQuery.isError) {
    if (getAxiosStatus(ticketQuery.error) === 403) {
      return (
        <AccessDeniedState description="You do not have permission to view this ticket." />
      );
    }
    return (
      <NotFoundState description="This ticket could not be found or failed to load." />
    );
  }

  if (!ticket) {
    return <NotFoundState />;
  }

  /* ---------- Handlers ---------- */

  function onSend(event: FormEvent) {
    event.preventDefault();
    if ((!hasHtmlContent(message) && tempUploadIds.length === 0) || uploading)
      return;
    messageMutation.mutate();
  }

  function onSendInternal(event: FormEvent) {
    event.preventDefault();
    if (
      (!hasHtmlContent(internalMessage) &&
        internalTempUploadIds.length === 0) ||
      internalUploading
    )
      return;
    internalMessageMutation.mutate();
  }

  const statusActions: Array<{ status: string; label: string; show: boolean }> =
    [
      {
        status: "in_progress",
        label: "Start work",
        show: !!ticket.access?.can_start,
      },
      {
        status: "resolved",
        label: "Mark resolved",
        show: !!ticket.access?.can_resolve && ticket.status === "in_progress",
      },
      {
        status: "closed",
        label: "Cancel",
        show: !!ticket.access?.can_cancel,
      },
      {
        status: "closed",
        label: "Acknowledge",
        show: !!ticket.access?.can_close,
      },
      {
        status: "open",
        label: "Reopen",
        show:
          !!ticket.access?.can_change_status &&
          ["resolved", "closed"].includes(ticket.status),
      },
    ];

  function onStatusActionClick(action: { status: string; label: string }) {
    if (action.label === "Cancel" && action.status === "closed") {
      setConfirmStatusAction("cancel");
      return;
    }
    if (action.label === "Mark resolved" && action.status === "resolved") {
      setConfirmStatusAction("resolve");
      return;
    }
    statusMutation.mutate(action.status);
  }

  function confirmPendingStatusAction() {
    if (confirmStatusAction === "cancel") {
      statusMutation.mutate("closed");
    } else if (confirmStatusAction === "resolve") {
      statusMutation.mutate("resolved");
    }
    setConfirmStatusAction(null);
  }

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      {/* ======================================================== */}
      {/* 1. Ticket Details                                        */}
      {/* ======================================================== */}
      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="bg-muted/10 border-b pb-6">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-wide">
            {ticket.ticket_number}
          </p>
          <CardTitle className="mt-1 flex flex-wrap items-center gap-3 text-2xl tracking-tight">
            <span className="min-w-0">{ticket.title}</span>
            {presencePeers.length > 0 ? (
              <span className="flex items-center -space-x-2">
                {presencePeers.slice(0, 5).map((peer) => (
                  <span
                    key={peer.user_id}
                    title={peer.name ?? `User #${peer.user_id}`}
                  >
                    <Avatar size="sm" className="ring-background ring-2">
                      <AvatarFallback className="text-[10px]">
                        {(peer.name ?? `U${peer.user_id}`)
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </span>
                ))}
                <span className="text-muted-foreground ml-3 text-xs font-normal">
                  Viewing now
                </span>
              </span>
            ) : null}
          </CardTitle>

          {/* Meta row: status, section, category badges (read-only) */}
          <div className="flex flex-wrap items-center gap-2 pt-3">
            <Badge variant="secondary" className="px-2 py-0.5 text-[10px]">
              {formatStatus(ticket.status)}
            </Badge>
            {ticket.section_name ? (
              <Badge
                variant="outline"
                className="text-muted-foreground px-2 py-0.5 text-[10px]"
              >
                {ticket.section_name}
              </Badge>
            ) : null}
            {ticket.category?.name ? (
              <Badge
                variant="outline"
                className="text-muted-foreground px-2 py-0.5 text-[10px]"
              >
                {ticket.category.name}
              </Badge>
            ) : null}
          </div>

          {/* Requester + created date */}
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {ticket.requester ? (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs font-medium">
                  Requester
                </span>
                <PersonIdentity person={ticket.requester} size="sm" />
              </div>
            ) : null}
            <div className="text-muted-foreground flex items-center gap-2 text-xs tabular-nums">
              <span className="font-medium">Created</span>
              <span>{formatDateTime(ticket.created_at)}</span>
            </div>
          </div>
        </CardHeader>

        {/* Description */}
        <CardContent className="pt-6">
          <CardDescription className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">
            {ticket.description}
          </CardDescription>
        </CardContent>

        {/* Bottom actions footer — priority, assign, transfer, category, status */}
        {ticket.access?.is_staff ? (
          <div className="bg-muted/10 flex flex-wrap items-center gap-3 border-t p-4">
            {/* Priority */}
            {ticket.access?.can_change_priority ? (
              <div className="flex items-center gap-2">
                <Label className="text-muted-foreground text-xs">
                  Priority
                </Label>
                <Select
                  value={ticket.priority}
                  onValueChange={(value) => priorityMutation.mutate(value)}
                  disabled={priorityMutation.isPending}
                >
                  <SelectTrigger className="h-8 w-32 shadow-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["low", "medium", "high", "urgent"].map((p) => (
                      <SelectItem key={p} value={p}>
                        {formatPriority(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <Badge
                variant="outline"
                className="text-muted-foreground px-2 py-0.5 text-[10px]"
              >
                {formatPriority(ticket.priority)}
              </Badge>
            )}

            {/* Assign */}
            {ticket.access?.can_assign && sectionMembers.length > 0 ? (
              <div className="flex items-center gap-2">
                <Label className="text-muted-foreground text-xs">Assign</Label>
                <Select
                  value={
                    ticket.assigned_to ? String(ticket.assigned_to) : undefined
                  }
                  onValueChange={(value) =>
                    assignMutation.mutate(Number(value))
                  }
                  disabled={assignMutation.isPending}
                >
                  <SelectTrigger className="h-8 min-w-36 shadow-xs">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectionMembers.map((m) => (
                      <SelectItem key={m.user_id} value={String(m.user_id)}>
                        {m.name?.trim() || `User #${m.user_id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {/* Transfer */}
            {transferSections.length > 0 ? (
              <div className="flex items-center gap-2">
                <Label className="text-muted-foreground text-xs">
                  Transfer
                </Label>
                <Select
                  value=""
                  onValueChange={(value) =>
                    transferMutation.mutate(Number(value))
                  }
                  disabled={transferMutation.isPending}
                >
                  <SelectTrigger className="h-8 min-w-36 shadow-xs">
                    <SelectValue placeholder="Move to section…" />
                  </SelectTrigger>
                  <SelectContent>
                    {transferSections.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.section_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {/* Category */}
            {ticket.access?.can_change_category &&
            sectionCategories.length > 0 ? (
              <div className="flex items-center gap-2">
                <Label className="text-muted-foreground text-xs">
                  Category
                </Label>
                <Select
                  value={
                    ticket.category_id != null
                      ? String(ticket.category_id)
                      : undefined
                  }
                  onValueChange={(value) =>
                    categoryMutation.mutate(Number(value))
                  }
                  disabled={categoryMutation.isPending}
                >
                  <SelectTrigger className="h-8 min-w-36 shadow-xs">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectionCategories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {/* Spacer then status buttons */}
            <div className="flex-1" />

            {statusActions
              .filter((a) => a.show)
              .map((action) => (
                <Button
                  key={`${action.status}-${action.label}`}
                  type="button"
                  variant={
                    action.status === "in_progress" ||
                    action.status === "resolved"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  disabled={statusMutation.isPending}
                  onClick={() => onStatusActionClick(action)}
                  className="shadow-xs"
                >
                  {action.label}
                </Button>
              ))}
          </div>
        ) : statusActions.filter((a) => a.show).length > 0 ? (
          <div className="bg-muted/10 flex flex-wrap gap-2 border-t p-4">
            {statusActions
              .filter((a) => a.show)
              .map((action) => (
                <Button
                  key={`${action.status}-${action.label}`}
                  type="button"
                  variant={
                    action.status === "in_progress" ||
                    action.status === "resolved"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  disabled={statusMutation.isPending}
                  onClick={() => onStatusActionClick(action)}
                  className="shadow-xs"
                >
                  {action.label}
                </Button>
              ))}
          </div>
        ) : null}
      </Card>

      {/* ======================================================== */}
      {/* 2. CSAT (conditional)                                    */}
      {/* ======================================================== */}
      {ticket.status === "closed" &&
        ticket.access?.is_requester &&
        !ticket.csat_score && (
          <Card>
            <CardHeader>
              <CardTitle>How was this resolved?</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  csatMutation.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label>Score</Label>
                  <Select value={csatScore} onValueChange={setCsatScore}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["5", "4", "3", "2", "1"].map((n) => (
                        <SelectItem key={n} value={n}>
                          {n} / 5
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="csat-comment">Comment</Label>
                  <Textarea
                    id="csat-comment"
                    rows={2}
                    value={csatComment}
                    onChange={(e) => setCsatComment(e.target.value)}
                    placeholder="Optional comment"
                  />
                </div>
                <Button type="submit" disabled={csatMutation.isPending}>
                  Submit feedback
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

      {/* ======================================================== */}
      {/* 3. Conversation / Internal chat                          */}
      {/* ======================================================== */}
      {ticket.access?.is_staff ? (
        <div className="space-y-3">
          <div
            role="tablist"
            aria-label="Chat channel"
            className="bg-muted/40 border-border/60 flex flex-wrap gap-2 rounded-xl border p-1.5"
          >
            <Button
              type="button"
              role="tab"
              aria-selected={chatChannel === "conversation"}
              size="sm"
              variant={chatChannel === "conversation" ? "default" : "ghost"}
              className="flex-1 shadow-xs sm:flex-none"
              onClick={() => setChatChannel("conversation")}
            >
              Conversation
            </Button>
            <Button
              type="button"
              role="tab"
              aria-selected={chatChannel === "internal"}
              size="sm"
              variant={chatChannel === "internal" ? "default" : "ghost"}
              className={[
                "flex-1 shadow-xs sm:flex-none",
                chatChannel === "internal"
                  ? "bg-amber-600 text-white hover:bg-amber-600/90 dark:bg-amber-500 dark:text-amber-950 dark:hover:bg-amber-500/90"
                  : "text-amber-800 hover:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/10",
              ].join(" ")}
              onClick={() => setChatChannel("internal")}
            >
              Internal
              <span className="ml-1.5 text-[10px] font-normal opacity-80">
                Staff only
              </span>
            </Button>
          </div>

          {chatChannel === "conversation" ? (
            <TicketChatCard
              key="conversation"
              title="Conversation"
              ticketNumber={ticket.ticket_number}
              messages={ticket.messages ?? []}
              attachments={ticket.attachments ?? []}
              currentUserId={Number(authUserQuery.data?.id) || 0}
              message={message}
              onMessageChange={setMessage}
              tempUploadIds={tempUploadIds}
              onTempUploadIdsChange={setTempUploadIds}
              uploading={uploading}
              onUploadingChange={setUploading}
              onSubmit={onSend}
              pending={messageMutation.isPending}
              replyPlaceholder="Write a reply…"
              emptyMessagesLabel="No messages yet."
              emptyMediaLabel="No files uploaded on this ticket yet."
              submitLabel="Send reply"
              templates={publicTemplates}
            />
          ) : (
            <TicketChatCard
              key="internal"
              title="Internal chat"
              subtitle="Staff only — not visible to the requester"
              ticketNumber={ticket.ticket_number}
              messages={ticket.internal_remarks ?? []}
              attachments={ticket.internal_attachments ?? []}
              currentUserId={Number(authUserQuery.data?.id) || 0}
              message={internalMessage}
              onMessageChange={setInternalMessage}
              tempUploadIds={internalTempUploadIds}
              onTempUploadIdsChange={setInternalTempUploadIds}
              uploading={internalUploading}
              onUploadingChange={setInternalUploading}
              onSubmit={onSendInternal}
              pending={internalMessageMutation.isPending}
              replyPlaceholder="Write an internal note… Use @ to mention staff"
              emptyMessagesLabel="No internal notes yet."
              emptyMediaLabel="No internal files yet."
              submitLabel="Send internal note"
              templates={internalTemplates}
              mentionCandidates={sectionMembers
                .map((m) => ({
                  user_id: m.user_id,
                  name: m.name?.trim() || "",
                }))
                .filter((m) => m.name)}
              accent
            />
          )}
        </div>
      ) : (
        <TicketChatCard
          title="Conversation"
          ticketNumber={ticket.ticket_number}
          messages={ticket.messages ?? []}
          attachments={ticket.attachments ?? []}
          currentUserId={Number(authUserQuery.data?.id) || 0}
          message={message}
          onMessageChange={setMessage}
          tempUploadIds={tempUploadIds}
          onTempUploadIdsChange={setTempUploadIds}
          uploading={uploading}
          onUploadingChange={setUploading}
          onSubmit={onSend}
          pending={messageMutation.isPending}
          replyPlaceholder="Write a reply…"
          emptyMessagesLabel="No messages yet."
          emptyMediaLabel="No files uploaded on this ticket yet."
          submitLabel="Send reply"
        />
      )}

      {/* ======================================================== */}
      {/* 4. Checklist (staff)                                     */}
      {/* ======================================================== */}
      {ticket.access?.is_staff ? (
        <TicketChecklistCard ticketNumber={ticket.ticket_number} />
      ) : null}

      {/* ======================================================== */}
      {/* 5–6. Linked tickets + Watchers (staff)                   */}
      {/* ======================================================== */}
      {ticket.access?.is_staff ? (
        <div className="grid gap-6 md:grid-cols-2">
          <TicketLinksCard
            ticketNumber={ticket.ticket_number}
            canManage={!!ticket.access?.is_staff}
          />
          {canManageWatchers ? (
            <Card className="shadow-sm">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-lg">Watchers</CardTitle>
                <CardDescription>Notified on updates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-5">
                {(ticket.watchers?.length ?? 0) === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No watchers yet.
                  </p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {ticket.watchers?.map((watcher) => {
                      const person = watcher.user ?? { name: null };
                      const displayName =
                        getPersonDisplayName(person) ||
                        `User #${watcher.user_id}`;
                      const hrSection = person.hr_section_name?.trim() || null;
                      const avatarUrl = getPersonAvatarUrl(person);
                      return (
                        <li key={watcher.user_id} className="relative">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <Avatar
                                  size="sm"
                                  className="ring-background ring-2"
                                  aria-label={displayName}
                                >
                                  {avatarUrl ? (
                                    <AvatarImage
                                      src={avatarUrl}
                                      alt={displayName}
                                    />
                                  ) : null}
                                  <AvatarFallback className="text-[10px]">
                                    {getPersonInitials(person)}
                                  </AvatarFallback>
                                </Avatar>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-56">
                              <p className="font-medium">{displayName}</p>
                              {hrSection ? (
                                <p className="text-background/80 mt-0.5">
                                  {hrSection}
                                </p>
                              ) : null}
                            </TooltipContent>
                          </Tooltip>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="secondary"
                            className="border-background absolute -top-1.5 -right-1.5 size-5 rounded-full border shadow-xs"
                            disabled={removeWatcherMutation.isPending}
                            onClick={() =>
                              removeWatcherMutation.mutate(watcher.user_id)
                            }
                            aria-label={`Remove ${displayName}`}
                          >
                            <X className="size-3" />
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {watcherCandidates.length > 0 ? (
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      <Label className="text-xs">Add</Label>
                      <Select
                        value={watcherUserId || undefined}
                        onValueChange={setWatcherUserId}
                      >
                        <SelectTrigger className="h-8 shadow-xs">
                          <SelectValue placeholder="Staff…" />
                        </SelectTrigger>
                        <SelectContent>
                          {watcherCandidates.map((member) => (
                            <SelectItem
                              key={member.user_id}
                              value={String(member.user_id)}
                            >
                              {member.name?.trim() || `User #${member.user_id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!watcherUserId || addWatcherMutation.isPending}
                      onClick={() =>
                        addWatcherMutation.mutate(Number(watcherUserId))
                      }
                    >
                      Add
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {/* ======================================================== */}
      {/* 7. Timeline                                              */}
      {/* ======================================================== */}
      {(ticket.timeline?.length ?? 0) > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-lg">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-0 text-sm">
              {ticket.timeline?.map((item, idx) => (
                <div
                  key={`${item.action}-${idx}`}
                  className="relative pb-4 pl-6 last:pb-0"
                >
                  <div
                    className="bg-border absolute top-1.5 left-[3px] h-full w-[2px] last:hidden"
                    aria-hidden="true"
                  />
                  <div
                    className="border-primary bg-background absolute top-1.5 left-0 h-2 w-2 rounded-full border-2"
                    aria-hidden="true"
                  />
                  <span className="text-foreground inline-flex flex-wrap items-center gap-1.5 font-medium">
                    <TimelineRichText text={item.action} />
                  </span>
                  {item.detail ? (
                    <span className="text-muted-foreground ml-2 inline-flex flex-wrap items-center gap-1.5">
                      — <TimelineRichText text={item.detail} />
                    </span>
                  ) : (
                    ""
                  )}
                  <span className="text-muted-foreground ml-3 text-xs tabular-nums">
                    {formatDateTime(item.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={confirmStatusAction != null}
        onOpenChange={(open) => {
          if (!open) setConfirmStatusAction(null);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmStatusAction === "cancel"
                ? "Cancel this ticket?"
                : "Mark as resolved?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmStatusAction === "cancel"
                ? "This marks the ticket as cancelled. You can reopen it later if needed."
                : "This marks the ticket as resolved and waits for the requester to acknowledge."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              variant={
                confirmStatusAction === "cancel" ? "destructive" : "default"
              }
              onClick={confirmPendingStatusAction}
            >
              {confirmStatusAction === "cancel"
                ? "Cancel ticket"
                : "Mark resolved"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

/* ================================================================== */
/*  Timeline helpers                                                  */
/* ================================================================== */

const TIMELINE_STATUS_PATTERN = /\b(open|in_progress|resolved|closed)\b/g;

function TimelineRichText({ text }: { text: string }) {
  const parts = text.split(TIMELINE_STATUS_PATTERN);

  return (
    <>
      {parts.map((part, index) => {
        if (
          part === "open" ||
          part === "in_progress" ||
          part === "resolved" ||
          part === "closed"
        ) {
          return (
            <StatusBadge key={`${part}-${index}`} status={part} size="sm" />
          );
        }

        if (!part) return null;

        return <span key={`text-${index}`}>{part}</span>;
      })}
    </>
  );
}

/* ================================================================== */
/*  MessageBubble                                                     */
/* ================================================================== */

function MessageBubble({
  message,
  isOwn,
  mentionLabels,
}: {
  message: TicketMessage;
  isOwn: boolean;
  mentionLabels?: Record<number, string>;
}) {
  const person = message.user ?? { name: null };
  const displayName = getPersonDisplayName(person);
  const avatarUrl = getPersonAvatarUrl(person);
  const timeLabel = message.created_at
    ? new Date(message.created_at).toLocaleString()
    : null;

  const sanitizedHtml = sanitizeRichTextHtml(message.body);

  return (
    <div
      className={[
        "flex w-full gap-2",
        isOwn ? "flex-row-reverse" : "flex-row",
      ].join(" ")}
    >
      {!isOwn ? (
        <Avatar size="sm" className="mt-5 shrink-0">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
          <AvatarFallback>{getPersonInitials(person)}</AvatarFallback>
        </Avatar>
      ) : null}
      <div
        className={[
          "flex max-w-[80%] min-w-0 flex-col gap-1",
          isOwn ? "items-end" : "items-start",
        ].join(" ")}
      >
        <p
          className={[
            "text-muted-foreground px-1 text-xs font-medium",
            isOwn ? "text-right" : "text-left",
          ].join(" ")}
        >
          {isOwn ? "You" : displayName}
        </p>
        <div
          className={[
            "rich-text-editor-content rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-xs",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md",
          ].join(" ")}
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
        {timeLabel ? (
          <p className="text-muted-foreground px-1 text-[10px] tabular-nums">
            {timeLabel}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  MentionRichText (kept for fallback / internal notes)              */
/* ================================================================== */

function MentionRichText({
  text,
  labels = {},
  emphasize = false,
}: {
  text: string;
  labels?: Record<number, string>;
  emphasize?: boolean;
}) {
  const mentionClass = emphasize
    ? "rounded bg-white/20 px-1 font-semibold"
    : "bg-primary/15 text-primary rounded px-1 font-semibold";

  const spans: Array<{ start: number; end: number; display: string }> = [];

  for (const match of text.matchAll(/@user:(\d+)/g)) {
    const id = Number(match[1]);
    const start = match.index ?? 0;
    const end = start + match[0].length;
    const name = labels[id]?.trim();
    spans.push({
      start,
      end,
      display: name ? `@${name}` : "@Unknown",
    });
  }

  const names = [
    ...new Set(
      Object.values(labels)
        .map((name) => name.trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => b.length - a.length);

  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|\\s)(@${escaped})(?=$|\\s|[.,!?;:])`, "g");
    for (const match of text.matchAll(re)) {
      const prefix = match[1] ?? "";
      const token = match[2] ?? "";
      const start = (match.index ?? 0) + prefix.length;
      const end = start + token.length;
      if (spans.some((span) => start < span.end && end > span.start)) {
        continue;
      }
      spans.push({ start, end, display: `@${name}` });
    }
  }

  spans.sort((a, b) => a.start - b.start);

  const nodes: ReactNode[] = [];
  let cursor = 0;
  spans.forEach((span, index) => {
    if (span.start < cursor) return;
    if (cursor < span.start) {
      nodes.push(
        <span key={`t-${index}-${cursor}`}>
          {text.slice(cursor, span.start)}
        </span>,
      );
    }
    nodes.push(
      <span key={`m-${index}-${span.start}`} className={mentionClass}>
        {span.display}
      </span>,
    );
    cursor = span.end;
  });
  if (cursor < text.length) {
    nodes.push(<span key="tail">{text.slice(cursor)}</span>);
  }

  return <>{nodes.length > 0 ? nodes : text}</>;
}

/* ================================================================== */
/*  AttachmentList                                                    */
/* ================================================================== */

function AttachmentList({
  ticketNumber,
  attachments,
  compact = false,
}: {
  ticketNumber: string;
  attachments: TicketAttachment[];
  compact?: boolean;
}) {
  return (
    <ul
      className={compact ? "flex flex-wrap gap-2" : "grid gap-2 sm:grid-cols-2"}
    >
      {attachments.map((file) => (
        <li key={file.id}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shadow-xs max-w-full"
            onClick={() =>
              void downloadTicketAttachment(
                ticketNumber,
                file.id,
                file.original_name,
              )
            }
          >
            <Paperclip className="mr-2 size-3.5 shrink-0" />
            <span className="truncate">{file.original_name}</span>
            {!compact ? (
              <span className="text-muted-foreground ml-2 shrink-0 text-xs">
                {file.kind} · {Math.round(file.size_bytes / 1024)} KB
              </span>
            ) : null}
          </Button>
        </li>
      ))}
    </ul>
  );
}

/* ================================================================== */
/*  TicketChatCard (TipTap composer)                                  */
/* ================================================================== */

function TicketChatCard({
  title,
  subtitle,
  ticketNumber,
  messages,
  attachments,
  currentUserId,
  message,
  onMessageChange,
  tempUploadIds,
  onTempUploadIdsChange,
  uploading,
  onUploadingChange,
  onSubmit,
  pending,
  replyPlaceholder,
  emptyMessagesLabel,
  emptyMediaLabel,
  submitLabel,
  templates = [],
  mentionCandidates,
  accent = false,
}: {
  title: string;
  subtitle?: string;
  ticketNumber: string;
  messages: TicketMessage[];
  attachments: TicketAttachment[];
  currentUserId: number;
  message: string;
  onMessageChange: (value: string) => void;
  tempUploadIds: Array<string | number>;
  onTempUploadIdsChange: Dispatch<SetStateAction<Array<string | number>>>;
  uploading: boolean;
  onUploadingChange: (uploading: boolean) => void;
  onSubmit: (event: FormEvent) => void;
  pending: boolean;
  replyPlaceholder: string;
  emptyMessagesLabel: string;
  emptyMediaLabel: string;
  submitLabel: string;
  templates?: BoardTemplate[];
  mentionCandidates?: Array<{ user_id: number; name: string }>;
  accent?: boolean;
}) {
  const replyId = accent ? "internal-reply" : "reply";
  const editorRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wasPendingRef = useRef(false);
  const [pendingFiles, setPendingFiles] = useState<
    Array<{ id: string | number; name: string }>
  >([]);

  useEffect(() => {
    setPendingFiles((prev) =>
      prev.filter((file) =>
        tempUploadIds.some((id) => String(id) === String(file.id)),
      ),
    );
  }, [tempUploadIds]);

  const lastMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    const pane = messagesScrollRef.current;
    if (pane) {
      pane.scrollTop = pane.scrollHeight;
      return;
    }
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, lastMessageId]);

  useEffect(() => {
    if (wasPendingRef.current && !pending && !hasHtmlContent(message)) {
      editorRef.current?.commands.setContent("", { emitUpdate: false });
      onMessageChange("");
      setPendingFiles([]);
    }
    wasPendingRef.current = pending;
  }, [pending, message, onMessageChange]);

  const mentionLabels = useMemo(() => {
    if (!mentionCandidates) return undefined;
    const map: Record<number, string> = {};
    for (const c of mentionCandidates) {
      map[c.user_id] = c.name;
    }
    return map;
  }, [mentionCandidates]);

  function insertTemplate(body: string) {
    onMessageChange(
      message && hasHtmlContent(message) ? `${message}<br/><br/>${body}` : body,
    );
  }

  async function handleUploadImage(file: File): Promise<string> {
    const upload = await uploadTempFile(file);
    onTempUploadIdsChange((prev) => [...prev, upload.id]);
    return upload.url;
  }

  function handleFooterAttachClick() {
    fileInputRef.current?.click();
  }

  async function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (selected.length === 0) return;

    const remaining = TICKET_ATTACHMENT_MAX_FILES - tempUploadIds.length;
    if (remaining <= 0) {
      toast.error(`You can attach up to ${TICKET_ATTACHMENT_MAX_FILES} files.`);
      return;
    }

    const files = selected.slice(0, remaining);
    if (selected.length > remaining) {
      toast.error(
        `Only ${remaining} more file(s) can be attached (max ${TICKET_ATTACHMENT_MAX_FILES}).`,
      );
    }

    const oversized = files.filter(
      (file) => file.size > TICKET_ATTACHMENT_MAX_SIZE,
    );
    const valid = files.filter(
      (file) => file.size <= TICKET_ATTACHMENT_MAX_SIZE,
    );
    if (oversized.length > 0) {
      toast.error("One or more files exceed the 25MB limit.");
    }
    if (valid.length === 0) return;

    onUploadingChange(true);
    let uploaded = 0;
    try {
      for (const file of valid) {
        try {
          const upload = await uploadTempFile(file);
          onTempUploadIdsChange((prev) => [...prev, upload.id]);
          setPendingFiles((prev) => [
            ...prev,
            {
              id: upload.id,
              name: upload.original_name || file.name,
            },
          ]);
          uploaded += 1;
        } catch {
          toast.error(`Could not upload ${file.name}`);
        }
      }
      if (uploaded > 0) {
        toast.success(
          uploaded === 1 ? "1 file attached" : `${uploaded} files attached`,
        );
      }
    } finally {
      onUploadingChange(false);
    }
  }

  async function removePendingFile(id: string | number) {
    setPendingFiles((prev) =>
      prev.filter((file) => String(file.id) !== String(id)),
    );
    onTempUploadIdsChange((prev) =>
      prev.filter((uploadId) => String(uploadId) !== String(id)),
    );
    try {
      await deleteTempUpload(id);
    } catch {
      // Best-effort cleanup; send path still drops the id.
    }
  }

  const canSend =
    (hasHtmlContent(message) || tempUploadIds.length > 0) &&
    !uploading &&
    !pending;

  return (
    <Card
      className={
        accent
          ? "border-amber-500/35 bg-card/80 shadow-sm dark:border-amber-500/25"
          : "bg-card/80 shadow-sm "
      }
    >
      <Tabs defaultValue="conversation">
        <CardHeader className="border-b pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{title}</CardTitle>
              {subtitle ? (
                <p className="text-muted-foreground text-xs">{subtitle}</p>
              ) : null}
            </div>
            <TabsList variant="line">
              <TabsTrigger value="conversation">Messages</TabsTrigger>
              <TabsTrigger value="media">
                Media
                {attachments.length > 0 ? ` (${attachments.length})` : ""}
              </TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>
        <TabsContent value="conversation" className="mt-0">
          <CardContent className="p-0">
            {attachments.length > 0 ? (
              <div className="border-b p-4 sm:p-5">
                <p className="mb-2 text-sm font-medium">Files</p>
                <AttachmentList
                  ticketNumber={ticketNumber}
                  attachments={attachments}
                  compact
                />
              </div>
            ) : null}
            <div className="flex min-h-80 max-h-[min(32rem,70vh)] flex-col">
              <div
                ref={messagesScrollRef}
                className="flex flex-1 flex-col gap-3 overflow-y-auto overscroll-y-contain p-4 sm:p-5"
              >
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={currentUserId > 0 && msg.user_id === currentUserId}
                    mentionLabels={mentionLabels}
                  />
                ))}
                {messages.length === 0 && (
                  <div className="text-muted-foreground py-6 text-center text-sm">
                    {emptyMessagesLabel}
                  </div>
                )}
                <div ref={messagesEndRef} aria-hidden="true" />
              </div>

              {/* Composer */}
              <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 border-t p-4 sm:p-5">
                <form onSubmit={onSubmit} className="space-y-3">
                  <Label htmlFor={replyId} className="sr-only">
                    {title}
                  </Label>
                  <RichTextEditor
                    value={message}
                    onChange={onMessageChange}
                    placeholder={replyPlaceholder}
                    disabled={pending}
                    onUploadingChange={onUploadingChange}
                    showImageButton={false}
                    minHeight="100px"
                    onEditorReady={(editor) => {
                      editorRef.current = editor;
                    }}
                  />
                  {pendingFiles.length > 0 ? (
                    <ul className="flex flex-wrap gap-2">
                      {pendingFiles.map((file) => (
                        <li
                          key={String(file.id)}
                          className="bg-muted/50 flex max-w-full items-center gap-1 rounded-md border px-2 py-1 text-xs"
                        >
                          <Paperclip className="size-3 shrink-0" />
                          <span className="truncate">{file.name}</span>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground ml-0.5"
                            onClick={() => void removePendingFile(file.id)}
                            aria-label={`Remove ${file.name}`}
                          >
                            <X className="size-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={TICKET_ATTACHMENT_ACCEPT_ATTR}
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                  <div className="flex items-center justify-between gap-2">
                    {templates.length > 0 ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shadow-xs"
                          >
                            Insert template
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="max-w-72">
                          {templates.map((tpl) => (
                            <DropdownMenuItem
                              key={tpl.id}
                              onSelect={() => insertTemplate(tpl.body)}
                            >
                              <span className="truncate">{tpl.name}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span />
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleFooterAttachClick}
                        disabled={
                          pending ||
                          uploading ||
                          tempUploadIds.length >= TICKET_ATTACHMENT_MAX_FILES
                        }
                        aria-label="Attach files"
                      >
                        <Paperclip className="size-4" />
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!canSend}
                        className="shadow-xs"
                        aria-label={submitLabel}
                      >
                        <Send className="mr-1.5 size-4" />
                        {uploading ? "Uploading…" : submitLabel}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </CardContent>
        </TabsContent>
        <TabsContent value="media" className="mt-0">
          <CardContent className="p-5">
            {attachments.length > 0 ? (
              <AttachmentList
                ticketNumber={ticketNumber}
                attachments={attachments}
              />
            ) : (
              <p className="text-muted-foreground py-8 text-center text-sm">
                {emptyMediaLabel}
              </p>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
