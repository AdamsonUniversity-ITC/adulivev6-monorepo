import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignTicket,
  changeTicketCategory,
  changeTicketPriority,
  changeTicketStatus,
  fetchTicketAttachmentObjectUrl,
  downloadTicketAttachment,
  extractMentionIdsFromBody,
  fetchCurrentBoard,
  fetchTicket,
  heartbeatTicketPresence,
  type PresencePeer,
  type PersonProfile,
  returnTicketFromApproval,
  revokeTicketShare,
  sendTicketMessage,
  shareTicket,
  signOffTicketShare,
  submitCsat,
  submitTicketForApproval,
  type TicketAttachment,
  type TicketMessage,
  type TicketShare,
  transferTicketSection,
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
import {
  ChevronDown,
  Download,
  EllipsisVertical,
  Eye,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import { toast } from "@repo/ui/exports";
import { sanitizeRichTextHtml } from "@repo/ui/components/rich-text-editor";
import {
  deleteTempUpload,
  fetchTempUploadObjectUrl,
  uploadTempFile,
} from "@/lib/temp-uploads";
import {
  FilePreviewDialog,
  getAttachmentKind,
  type PreviewableAttachment,
  type RemoteFileAttachment,
} from "@/components/file-preview";

import { AccessDeniedState } from "@/components/access-denied-state";
import { LoadingState } from "@/components/loading-state";
import { NotFoundState } from "@/components/not-found-state";
import { PersonIdentity } from "@/components/person-identity";
import {
  TICKET_ATTACHMENT_ACCEPT_ATTR,
  TICKET_ATTACHMENT_MAX_FILES,
  TICKET_ATTACHMENT_MAX_SIZE,
} from "@/components/ticket-attachment-dropzone";
import { PriorityBadge, StatusBadge } from "@/components/ticket-badges";
import { TicketChecklistCard } from "@/components/ticket-checklist-card";
import { getAxiosMessage, getAxiosStatus } from "@/lib/axios-status";
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
  ButtonGroup,
  ButtonGroupSeparator,
} from "@repo/ui/components/button-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Label } from "@repo/ui/components/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
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
  const [presencePeers, setPresencePeers] = useState<PresencePeer[]>([]);
  const [confirmStatusAction, setConfirmStatusAction] = useState<
    null | "cancel" | "resolve" | "return_approval" | "sign_off"
  >(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareSectionId, setShareSectionId] = useState("");
  const [shareUserId, setShareUserId] = useState("");
  const [signOffNote, setSignOffNote] = useState("");
  const [cancelReasonId, setCancelReasonId] = useState("");
  const [cancelRemarks, setCancelRemarks] = useState("");

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
    mutationFn: ({
      status,
      cancellation,
    }: {
      status: string;
      cancellation?: { reasonId: number; remarks?: string | null };
    }) => changeTicketStatus(ticketNumber, status, undefined, cancellation),
    onSuccess: () => {
      invalidate();
      toast.success("Status updated");
    },
    onError: (error) =>
      toast.error(getAxiosMessage(error, "Could not update status")),
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
    onError: (error) =>
      toast.error(getAxiosMessage(error, "Could not update category.")),
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
    onError: (error) => {
      toast.error(getAxiosMessage(error, "Could not transfer this ticket."));
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

  const ticket = ticketQuery.data;

  const sectionMembers = useMemo(() => {
    if (!ticket?.section_id) return [];
    const section = (boardQuery.data?.sections ?? []).find(
      (s) => s.id === ticket.section_id,
    );
    return section?.members ?? [];
  }, [boardQuery.data?.sections, ticket?.section_id]);

  const mentionableStaff = useMemo(() => {
    if (ticket?.mentionable_staff && ticket.mentionable_staff.length > 0) {
      return ticket.mentionable_staff.map((member) => ({
        user_id: member.user_id,
        name: member.name?.trim() || `User ${member.user_id}`,
      }));
    }

    const seen = new Set<number>();
    const fallback: Array<{ user_id: number; name: string }> = [];
    for (const section of boardQuery.data?.sections ?? []) {
      for (const member of section.members ?? []) {
        const isTicketSection = section.id === ticket?.section_id;
        if (!isTicketSection && member.is_section_head !== true) {
          continue;
        }
        const name = member.name?.trim();
        if (!name || seen.has(member.user_id)) {
          continue;
        }
        seen.add(member.user_id);
        fallback.push({ user_id: member.user_id, name });
      }
    }
    return fallback;
  }, [
    boardQuery.data?.sections,
    ticket?.mentionable_staff,
    ticket?.section_id,
  ]);

  const sectionCategories = useMemo(() => {
    if (!ticket?.section_id) return [];
    return (boardQuery.data?.categories ?? []).filter(
      (category) => category.section_id === ticket.section_id,
    );
  }, [boardQuery.data?.categories, ticket?.section_id]);

  const internalMessageMutation = useMutation({
    mutationFn: () => {
      return sendTicketMessage(
        ticketNumber,
        internalMessage,
        "internal",
        internalTempUploadIds,
        extractMentionIdsFromBody(internalMessage, mentionableStaff),
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

  // Approver sections are reachable only through the approval action, so the
  // regular transfer menu must not list them.
  const transferSections = useMemo(() => {
    if (!ticket?.section_id) return [];
    return (boardQuery.data?.sections ?? []).filter(
      (s) => s.id !== ticket.section_id && s.is_approver !== true,
    );
  }, [boardQuery.data?.sections, ticket?.section_id]);

  const cancellationReasons = boardQuery.data?.cancellation_reasons ?? [];

  const approverSections = useMemo(() => {
    if (!ticket?.section_id) return [];
    return (boardQuery.data?.sections ?? []).filter(
      (s) => s.id !== ticket.section_id && s.is_approver === true,
    );
  }, [boardQuery.data?.sections, ticket?.section_id]);

  const submitApprovalMutation = useMutation({
    mutationFn: (sectionId: number) =>
      submitTicketForApproval(ticketNumber, sectionId),
    onSuccess: () => {
      invalidate();
      toast.success("Sent for approval");
    },
    onError: (error) =>
      toast.error(getAxiosMessage(error, "Could not send for approval")),
  });

  const returnApprovalMutation = useMutation({
    mutationFn: () => returnTicketFromApproval(ticketNumber),
    onSuccess: () => {
      invalidate();
      toast.success("Ticket sent back");
    },
    onError: (error) =>
      toast.error(getAxiosMessage(error, "Could not send the ticket back")),
  });

  const shares = useMemo<TicketShare[]>(
    () => ticket?.shares ?? [],
    [ticket?.shares],
  );

  // A section can only hold one sign-off row, and approver sections are reached
  // through the approval action instead.
  const shareableSections = useMemo(() => {
    if (!ticket?.section_id) return [];
    const taken = new Set(shares.map((s) => s.section_id));
    return (boardQuery.data?.sections ?? []).filter(
      (s) =>
        s.id !== ticket.section_id &&
        s.is_approver !== true &&
        !taken.has(s.id),
    );
  }, [boardQuery.data?.sections, shares, ticket?.section_id]);

  const shareSectionMembers = useMemo(() => {
    if (!shareSectionId) return [];
    return (
      (boardQuery.data?.sections ?? []).find(
        (s) => s.id === Number(shareSectionId),
      )?.members ?? []
    );
  }, [boardQuery.data?.sections, shareSectionId]);

  const mySignOff = shares.find((s) => s.can_sign_off) ?? null;

  const shareMutation = useMutation({
    mutationFn: () =>
      shareTicket(
        ticketNumber,
        Number(shareSectionId),
        shareUserId ? Number(shareUserId) : null,
      ),
    onSuccess: () => {
      invalidate();
      setShareDialogOpen(false);
      setShareSectionId("");
      setShareUserId("");
      toast.success("Ticket shared");
    },
    onError: (error) =>
      toast.error(getAxiosMessage(error, "Could not share the ticket")),
  });

  const revokeShareMutation = useMutation({
    mutationFn: (shareId: number) => revokeTicketShare(ticketNumber, shareId),
    onSuccess: () => {
      invalidate();
      toast.success("Sharing removed");
    },
    onError: (error) =>
      toast.error(getAxiosMessage(error, "Could not remove sharing")),
  });

  const signOffMutation = useMutation({
    mutationFn: (shareId: number) =>
      signOffTicketShare(ticketNumber, shareId, signOffNote || undefined),
    onSuccess: () => {
      invalidate();
      setSignOffNote("");
      toast.success("Sign-off recorded");
    },
    onError: (error) =>
      toast.error(getAxiosMessage(error, "Could not record the sign-off")),
  });

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

  const canUseInternalChat =
    !!ticket.access?.is_staff || !!ticket.access?.can_internal;

  // Resolved and closed tickets are read-only: only acknowledge and reopen remain.
  const isLocked = !!ticket.access?.is_locked;
  const conversationReadOnlyNotice = `This ticket is ${formatStatus(ticket.status).toLowerCase()}, so the conversation with the requestor is closed.`;

  /* ---------- Handlers ---------- */

  function onSend(event: FormEvent) {
    event.preventDefault();
    if ((!message.trim() && tempUploadIds.length === 0) || uploading) return;
    messageMutation.mutate();
  }

  function onSendInternal(event: FormEvent) {
    event.preventDefault();
    if (
      (!internalMessage.trim() && internalTempUploadIds.length === 0) ||
      internalUploading
    )
      return;
    internalMessageMutation.mutate();
  }

  function confirmPendingStatusAction() {
    if (confirmStatusAction === "cancel") {
      if (!cancelReasonId) return;
      statusMutation.mutate({
        status: "closed",
        cancellation: {
          reasonId: Number(cancelReasonId),
          remarks: cancelRemarks.trim() || null,
        },
      });
    } else if (confirmStatusAction === "resolve") {
      statusMutation.mutate({ status: "resolved" });
    } else if (confirmStatusAction === "return_approval") {
      returnApprovalMutation.mutate();
    } else if (confirmStatusAction === "sign_off" && mySignOff) {
      signOffMutation.mutate(mySignOff.id);
    }
    closeStatusConfirm();
  }

  function closeStatusConfirm() {
    setConfirmStatusAction(null);
    setCancelReasonId("");
    setCancelRemarks("");
  }

  const canSubmitForApproval =
    !!ticket.access?.can_submit_for_approval && approverSections.length > 0;
  const canReturnFromApproval = !!ticket.access?.can_return_from_approval;
  const returnTargetLabel =
    ticket.approval?.origin_section_name?.trim() || "the requesting section";
  const canShare = !!ticket.access?.can_share && shareableSections.length > 0;
  const remainingSignOffs = shares.filter((s) => !s.resolved_at).length;

  type TicketAction = {
    key: string;
    label: string;
    variant: "default" | "outline";
    disabled: boolean;
    onSelect: () => void;
    /** Multiple approver sections need a nested picker rather than a plain item. */
    submenu?: Array<{ id: number; label: string; onSelect: () => void }>;
  };

  // Order decides the primary slot, so the visible label follows ticket state.
  const candidateActions: Array<TicketAction | false | null | undefined> = [
    ticket.access?.can_start && {
      key: "start",
      label: "Start work",
      variant: "default",
      disabled: statusMutation.isPending,
      onSelect: () => statusMutation.mutate({ status: "in_progress" }),
    },
    canReturnFromApproval && {
      key: "return_approval",
      label: `Send back to ${returnTargetLabel}`,
      variant: "default",
      disabled: returnApprovalMutation.isPending,
      onSelect: () => setConfirmStatusAction("return_approval"),
    },
    mySignOff && {
      key: "sign_off",
      label: "Mark my part resolved",
      variant: "default",
      disabled: signOffMutation.isPending,
      onSelect: () => setConfirmStatusAction("sign_off"),
    },
    ticket.access?.can_resolve &&
      ticket.status === "in_progress" && {
        key: "resolve",
        label: "Mark resolved",
        variant: "default",
        disabled: statusMutation.isPending,
        onSelect: () => setConfirmStatusAction("resolve"),
      },
    ticket.access?.can_close && {
      key: "close",
      label: "Acknowledge",
      variant: "outline",
      disabled: statusMutation.isPending,
      onSelect: () => statusMutation.mutate({ status: "closed" }),
    },
    ticket.access?.can_reopen && {
      key: "reopen",
      label: "Reopen",
      variant: "outline",
      disabled: statusMutation.isPending,
      onSelect: () => statusMutation.mutate({ status: "open" }),
    },
    canSubmitForApproval && {
      key: "submit_approval",
      label: "Send for approval",
      variant: "outline",
      disabled: submitApprovalMutation.isPending,
      onSelect: () => submitApprovalMutation.mutate(approverSections[0]!.id),
      ...(approverSections.length > 1
        ? {
            submenu: approverSections.map((s) => ({
              id: s.id,
              label: s.section_name,
              onSelect: () => submitApprovalMutation.mutate(s.id),
            })),
          }
        : {}),
    },
    canShare && {
      key: "share",
      label: "Share",
      variant: "outline",
      disabled: false,
      onSelect: () => setShareDialogOpen(true),
    },
    ticket.access?.can_cancel && {
      key: "cancel",
      label: "Cancel",
      variant: "outline",
      disabled: statusMutation.isPending,
      onSelect: () => setConfirmStatusAction("cancel"),
    },
  ];

  const ticketActions = candidateActions.filter((a): a is TicketAction => !!a);

  // Cancel stays a standalone button; the rest collapse into the split button.
  const cancelAction = ticketActions.find((a) => a.key === "cancel") ?? null;
  const [primaryAction, ...menuActions] = ticketActions.filter(
    (a) => a.key !== "cancel",
  );

  // Both the staff and shared-participant bars render this same row.
  const actionButtons = (
    <div className="flex flex-wrap items-center gap-2">
      {primaryAction ? (
        <ButtonGroup>
          {primaryAction.submenu ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant={primaryAction.variant}
                  size="sm"
                  disabled={primaryAction.disabled}
                >
                  {primaryAction.label}
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-w-72">
                {primaryAction.submenu.map((entry) => (
                  <DropdownMenuItem key={entry.id} onSelect={entry.onSelect}>
                    <span className="truncate">{entry.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              type="button"
              variant={primaryAction.variant}
              size="sm"
              disabled={primaryAction.disabled}
              onClick={primaryAction.onSelect}
            >
              {primaryAction.label}
            </Button>
          )}

          {menuActions.length > 0 ? (
            <>
              <ButtonGroupSeparator />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant={primaryAction.variant}
                    size="icon-sm"
                    aria-label="More actions"
                  >
                    <EllipsisVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-w-72">
                  {menuActions.map((action) =>
                    action.submenu ? (
                      <DropdownMenuSub key={action.key}>
                        <DropdownMenuSubTrigger disabled={action.disabled}>
                          {action.label}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="max-w-72">
                          {action.submenu.map((entry) => (
                            <DropdownMenuItem
                              key={entry.id}
                              onSelect={entry.onSelect}
                            >
                              <span className="truncate">{entry.label}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    ) : (
                      <DropdownMenuItem
                        key={action.key}
                        disabled={action.disabled}
                        onSelect={action.onSelect}
                      >
                        <span className="truncate">{action.label}</span>
                      </DropdownMenuItem>
                    ),
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : null}
        </ButtonGroup>
      ) : null}

      {cancelAction ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shadow-xs"
          disabled={cancelAction.disabled}
          onClick={cancelAction.onSelect}
        >
          {cancelAction.label}
        </Button>
      ) : null}
    </div>
  );

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  return (
    <section className="-mx-1 -my-2 w-full max-w-none space-y-4 sm:-mx-2 sm:-my-3">
      {/* ======================================================== */}
      {/* 1. Ticket Details                                        */}
      {/* ======================================================== */}
      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="bg-muted/10 border-b pb-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="flex min-w-0 flex-1 flex-wrap items-center gap-3 text-2xl tracking-tight">
              <span className="min-w-0">
                <span className="text-muted-foreground mr-2 text-sm font-medium">
                  Ticket Title:
                </span>
                {ticket.title}
              </span>
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
            <p className="text-muted-foreground shrink-0 text-[10px] font-semibold tracking-wide tabular-nums">
              Control No.: {ticket.ticket_number}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <StatusBadge status={ticket.status} size="md" />

            {ticket.access?.can_change_priority ? (
              <BadgeMenu
                ariaLabel="Change priority"
                badge={(chevron) => (
                  <PriorityBadge
                    priority={ticket.priority}
                    size="md"
                    trailing={chevron}
                  />
                )}
                items={["low", "medium", "high", "urgent"].map((p) => ({
                  value: p,
                  label: formatPriority(p),
                }))}
                onSelect={(value) => priorityMutation.mutate(value)}
                disabled={priorityMutation.isPending}
              />
            ) : (
              <PriorityBadge priority={ticket.priority} size="md" />
            )}

            {transferSections.length > 0 && ticket.access?.can_change_section ? (
              <BadgeMenu
                ariaLabel="Transfer section"
                badge={(chevron) => (
                  <Badge className="inline-flex items-center gap-0.5 border-slate-500/30 bg-slate-500/10 px-2 py-0.5 text-[10px] text-slate-700 dark:text-slate-300">
                    {ticket.section_name ?? "Section"}
                    {chevron}
                  </Badge>
                )}
                items={transferSections.map((s) => ({
                  value: String(s.id),
                  label: s.section_name,
                }))}
                onSelect={(value) => transferMutation.mutate(Number(value))}
                disabled={transferMutation.isPending}
              />
            ) : ticket.section_name ? (
              <Badge className="border-slate-500/30 bg-slate-500/10 px-2 py-0.5 text-[10px] text-slate-700 dark:text-slate-300">
                {ticket.section_name}
              </Badge>
            ) : null}

            {ticket.transfer?.from_section_name ? (
              <span className="text-muted-foreground text-[10px]">
                from {ticket.transfer.from_section_name}
              </span>
            ) : null}

            {ticket.access?.can_change_category &&
            sectionCategories.length > 0 ? (
              <BadgeMenu
                ariaLabel="Change category"
                badge={(chevron) => (
                  <Badge className="inline-flex items-center gap-0.5 border-teal-500/30 bg-teal-500/10 px-2 py-0.5 text-[10px] text-teal-800 dark:text-teal-300">
                    {ticket.category?.name ?? "Category"}
                    {chevron}
                  </Badge>
                )}
                items={sectionCategories.map((category) => ({
                  value: String(category.id),
                  label: category.name,
                }))}
                onSelect={(value) => categoryMutation.mutate(Number(value))}
                disabled={categoryMutation.isPending}
              />
            ) : ticket.category?.name ? (
              <Badge className="border-teal-500/30 bg-teal-500/10 px-2 py-0.5 text-[10px] text-teal-800 dark:text-teal-300">
                {ticket.category.name}
              </Badge>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {ticket.requester ? (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs font-medium">
                  Requestor
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

        <CardContent className="pt-2">
          <p className="mb-1 text-sm font-semibold">Description</p>
          <CardDescription className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">
            {ticket.description}
          </CardDescription>
        </CardContent>

        {ticket.cancel_reason ? (
          <div className="border-t px-4 py-3">
            <p className="text-sm">
              <span className="text-muted-foreground text-xs font-medium">
                Closed because
              </span>{" "}
              <span className="font-medium">{ticket.cancel_reason.label}</span>
            </p>
            {ticket.cancel_remarks ? (
              <p className="text-muted-foreground mt-1 whitespace-pre-wrap text-sm">
                {ticket.cancel_remarks}
              </p>
            ) : null}
          </div>
        ) : null}

        {shares.length > 0 ? (
          <div className="border-t px-4 py-3">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold">Sign-offs</p>
              <p className="text-muted-foreground text-xs tabular-nums">
                {shares.length - remainingSignOffs} of {shares.length} complete
              </p>
            </div>
            <ul className="divide-y">
              {shares.map((share) => (
                <li
                  key={share.id}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <span className="font-medium">
                      {share.user_name?.trim() ||
                        share.section_name ||
                        `Section #${share.section_id}`}
                    </span>
                    {share.user_name?.trim() && share.section_name ? (
                      <span className="text-muted-foreground">
                        {" "}
                        · {share.section_name}
                      </span>
                    ) : null}
                    {share.is_owner ? (
                      <span className="text-muted-foreground"> · owner</span>
                    ) : null}
                    {share.resolution_note ? (
                      <p className="text-muted-foreground truncate text-xs">
                        {share.resolution_note}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    {share.resolved_at ? (
                      <span className="text-muted-foreground text-xs tabular-nums">
                        Resolved {formatDateTime(share.resolved_at)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        Pending
                      </span>
                    )}
                    {!share.resolved_at &&
                    !share.is_owner &&
                    ticket.access?.can_share ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground h-7 px-2 text-xs"
                        disabled={revokeShareMutation.isPending}
                        onClick={() => revokeShareMutation.mutate(share.id)}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {ticket.access?.is_staff ? (
          <div className="bg-muted/10 flex flex-wrap items-center gap-3 border-t px-4 py-2.5">
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

            {actionButtons}
          </div>
        ) : primaryAction || cancelAction ? (
          // A participant shared in from another section is not section staff
          // here, so their sign-off action has to live on this branch too.
          <div className="bg-muted/10 border-t px-4 py-2.5">
            {actionButtons}
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
      {canUseInternalChat ? (
        chatChannel === "conversation" ? (
          <TicketChatCard
            key="conversation"
            title="Conversation"
            channelSwitcher={
              <ChatChannelSwitcher
                chatChannel={chatChannel}
                onChange={setChatChannel}
              />
            }
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
            readOnly={isLocked}
            readOnlyLabel={conversationReadOnlyNotice}
          />
        ) : (
          <TicketChatCard
            key="internal"
            title="Internal chat"
            subtitle="Staff only — not visible to the requestor"
            channelSwitcher={
              <ChatChannelSwitcher
                chatChannel={chatChannel}
                onChange={setChatChannel}
              />
            }
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
            mentionCandidates={mentionableStaff}
            accent
            // Staff keep coordinating here after the ticket is resolved or
            // closed, so this channel outlives the lock.
            readOnly={false}
          />
        )
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
          readOnly={isLocked}
          readOnlyLabel={conversationReadOnlyNotice}
        />
      )}

      {/* ======================================================== */}
      {/* 4–5. Checklist + Timeline                                */}
      {/* ======================================================== */}
      {(() => {
        const showChecklist = !!ticket.access?.is_staff;
        const showTimeline = (ticket.timeline?.length ?? 0) > 0;
        if (!showChecklist && !showTimeline) return null;
        const alone = (showChecklist ? 1 : 0) + (showTimeline ? 1 : 0) === 1;
        const involvedFallback: PersonProfile[] = [];
        if (ticket.requester) involvedFallback.push(ticket.requester);
        if (
          ticket.assignee &&
          ticket.assignee.user_id !== ticket.requester?.user_id
        ) {
          involvedFallback.push(ticket.assignee);
        }
        const involved =
          ticket.involved && ticket.involved.length > 0
            ? ticket.involved
            : involvedFallback;
        const visibleInvolved = involved.slice(0, 5);
        const involvedOverflow = Math.max(
          0,
          involved.length - visibleInvolved.length,
        );
        return (
          <div className="grid items-stretch gap-4 md:grid-cols-2">
            {showChecklist ? (
              <div
                className={`h-full min-h-64 ${alone ? "md:col-span-2" : ""}`}
              >
                <TicketChecklistCard
                  ticketNumber={ticket.ticket_number}
                  readOnly={isLocked}
                />
              </div>
            ) : null}
            {showTimeline ? (
              <Card
                className={`flex h-full min-h-64 flex-col shadow-sm ${alone ? "md:col-span-2" : ""}`}
              >
                <CardHeader className="flex flex-row items-center justify-between gap-3 border-b pb-2">
                  <CardTitle className="text-lg">Timeline</CardTitle>
                  {involved.length > 0 ? (
                    <span className="flex items-center space-x-2">
                      {visibleInvolved.map((person) => {
                        const name = getPersonDisplayName(person);
                        const avatarUrl = getPersonAvatarUrl(person);
                        return (
                          <span key={person.user_id} title={name}>
                            <Avatar
                              size="sm"
                              className="ring-background ring-2"
                            >
                              {avatarUrl ? (
                                <AvatarImage src={avatarUrl} alt={name} />
                              ) : null}
                              <AvatarFallback className="text-[10px]">
                                {getPersonInitials(person)}
                              </AvatarFallback>
                            </Avatar>
                          </span>
                        );
                      })}
                      {involvedOverflow > 0 ? (
                        <span
                          title={`${involvedOverflow} more`}
                          className="bg-muted text-muted-foreground ring-background inline-flex size-6 items-center justify-center rounded-full text-[10px] font-medium ring-2"
                        >
                          +{involvedOverflow}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-0 text-sm">
                    {ticket.timeline?.map((item, idx) => (
                      <div
                        key={`${item.action}-${idx}`}
                        className="relative pb-3 pl-6 last:pb-0"
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
            ) : null}
          </div>
        );
      })()}

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share this ticket</DialogTitle>
            <DialogDescription>
              The section you pick works the ticket alongside yours. Everyone
              shared in, plus this section, has to mark their part resolved
              before the ticket closes out.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Section</Label>
              <Select
                value={shareSectionId}
                onValueChange={(value) => {
                  setShareSectionId(value);
                  setShareUserId("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a section" />
                </SelectTrigger>
                <SelectContent>
                  {shareableSections.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.section_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {shareSectionMembers.length > 0 ? (
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Person{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Select value={shareUserId} onValueChange={setShareUserId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Let the section head decide" />
                  </SelectTrigger>
                  <SelectContent>
                    {shareSectionMembers.map((m) => (
                      <SelectItem key={m.user_id} value={String(m.user_id)}>
                        {m.name?.trim() || `User #${m.user_id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShareDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!shareSectionId || shareMutation.isPending}
              onClick={() => shareMutation.mutate()}
            >
              Share ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmStatusAction != null}
        onOpenChange={(open) => {
          if (!open) closeStatusConfirm();
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmStatusAction === "cancel"
                ? "Cancel this ticket?"
                : confirmStatusAction === "return_approval"
                  ? `Send back to ${returnTargetLabel}?`
                  : confirmStatusAction === "sign_off"
                    ? "Mark your part resolved?"
                    : "Mark as resolved?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmStatusAction === "cancel"
                ? "This closes the ticket without resolving it. You can reopen it later if needed."
                : confirmStatusAction === "return_approval"
                  ? "This returns the ticket to its original section and section head, with the status it had before review."
                  : confirmStatusAction === "sign_off"
                    ? remainingSignOffs > 1
                      ? `This records your sign-off. ${remainingSignOffs - 1} other ${remainingSignOffs === 2 ? "participant" : "participants"} still have to mark their part resolved.`
                      : "You are the last participant, so this resolves the ticket."
                    : "This marks the ticket as resolved and waits for the requestor to acknowledge."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {confirmStatusAction === "sign_off" ? (
            <div className="space-y-1.5">
              <Label className="text-xs">
                What you did{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Textarea
                value={signOffNote}
                onChange={(event) => setSignOffNote(event.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Notes for the other participants"
              />
            </div>
          ) : null}
          {confirmStatusAction === "cancel" ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="cancel-reason">
                  Reason
                </Label>
                <Select
                  value={cancelReasonId || undefined}
                  onValueChange={setCancelReasonId}
                >
                  <SelectTrigger id="cancel-reason" className="w-full">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {cancellationReasons.map((reason) => (
                      <SelectItem key={reason.id} value={String(reason.id)}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {cancellationReasons.length === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    No cancellation reasons are configured yet. Ask an
                    administrator to add one.
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="cancel-remarks">
                  Remarks{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="cancel-remarks"
                  value={cancelRemarks}
                  onChange={(event) => setCancelRemarks(event.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Anything the requestor should know"
                />
              </div>
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              variant={
                confirmStatusAction === "cancel" ? "destructive" : "default"
              }
              disabled={confirmStatusAction === "cancel" && !cancelReasonId}
              onClick={confirmPendingStatusAction}
            >
              {confirmStatusAction === "cancel"
                ? "Cancel ticket"
                : confirmStatusAction === "return_approval"
                  ? "Send back"
                  : confirmStatusAction === "sign_off"
                    ? "Sign off"
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

const TIMELINE_STATUS_PATTERN =
  /\b(open|in_progress|pending_approval|resolved|closed)\b/g;

function TimelineRichText({ text }: { text: string }) {
  const parts = text.split(TIMELINE_STATUS_PATTERN);

  return (
    <>
      {parts.map((part, index) => {
        if (
          part === "open" ||
          part === "in_progress" ||
          part === "pending_approval" ||
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
  mentionLabels: _mentionLabels,
  ticketNumber,
  attachments,
}: {
  message: TicketMessage;
  isOwn: boolean;
  mentionLabels?: Record<number, string>;
  ticketNumber: string;
  attachments: TicketAttachment[];
}) {
  const person = message.user ?? { name: null };
  const displayName = getPersonDisplayName(person);
  const avatarUrl = getPersonAvatarUrl(person);
  const timeLabel = message.created_at
    ? new Date(message.created_at).toLocaleString()
    : null;

  const hasText = hasHtmlContent(message.body ?? "");
  const sanitizedHtml = hasText ? sanitizeRichTextHtml(message.body) : "";
  const messageAttachments = attachments.filter(
    (file) => Number(file.message_id) === Number(message.id),
  );

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
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-xs",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md",
          ].join(" ")}
        >
          {hasText ? (
            <div
              className="rich-text-editor-content"
              dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />
          ) : messageAttachments.length === 0 ? (
            <p className="text-muted-foreground italic">No message text</p>
          ) : null}
          {messageAttachments.length > 0 ? (
            <div className={hasText ? "mt-2" : undefined}>
              <AttachmentList
                ticketNumber={ticketNumber}
                attachments={messageAttachments}
                compact
              />
            </div>
          ) : null}
        </div>
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
  const [previewAttachment, setPreviewAttachment] =
    useState<PreviewableAttachment | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  function openAttachmentPreview(file: TicketAttachment) {
    const remote: RemoteFileAttachment = {
      id: file.id,
      name: file.original_name,
      file_name: file.original_name,
      mime_type: file.mime,
      size: file.size_bytes,
      kind: file.kind,
      fetchPreviewUrl: () =>
        fetchTicketAttachmentObjectUrl(ticketNumber, file.id),
    };
    setPreviewAttachment(remote);
    setPreviewOpen(true);
  }

  return (
    <>
      <ul
        className={
          compact ? "flex flex-wrap gap-2" : "grid gap-2 sm:grid-cols-2"
        }
      >
        {attachments.map((file) => {
          const kind = getAttachmentKind({
            id: file.id,
            name: file.original_name,
            mime_type: file.mime,
            size: file.size_bytes,
            kind: file.kind,
          });
          const isImage = kind === "image";

          return (
            <li key={file.id}>
              <div
                className={
                  compact
                    ? "bg-muted/50 flex max-w-full items-center gap-1 rounded-md border px-2 py-1 text-xs"
                    : "bg-card flex items-center gap-2 rounded-md border p-2 shadow-xs"
                }
              >
                {isImage ? (
                  <button
                    type="button"
                    className="size-8 shrink-0 overflow-hidden rounded border"
                    onClick={() => openAttachmentPreview(file)}
                    aria-label={`Preview ${file.original_name}`}
                  >
                    <AttachmentThumbnail
                      ticketNumber={ticketNumber}
                      attachment={file}
                    />
                  </button>
                ) : (
                  <Paperclip className="size-3.5 shrink-0" />
                )}
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-left hover:underline"
                  onClick={() => openAttachmentPreview(file)}
                >
                  {file.original_name}
                </button>
                {!compact ? (
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {file.kind} · {Math.round(file.size_bytes / 1024)} KB
                  </span>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  onClick={() => openAttachmentPreview(file)}
                  aria-label={`Preview ${file.original_name}`}
                >
                  <Eye className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  onClick={() =>
                    void downloadTicketAttachment(
                      ticketNumber,
                      file.id,
                      file.original_name,
                    )
                  }
                  aria-label={`Download ${file.original_name}`}
                >
                  <Download className="size-3.5" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <FilePreviewDialog
        attachment={previewAttachment}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </>
  );
}

function AttachmentThumbnail({
  ticketNumber,
  attachment,
}: {
  ticketNumber: string;
  attachment: TicketAttachment;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    void fetchTicketAttachmentObjectUrl(ticketNumber, attachment.id)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.id, ticketNumber]);

  if (!src) {
    return (
      <span className="bg-muted flex size-full items-center justify-center">
        <Paperclip className="text-muted-foreground size-3" />
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={attachment.original_name}
      className="size-full object-cover"
    />
  );
}

function PendingUploadThumbnail({
  tempUploadId,
}: {
  tempUploadId: string | number;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    void fetchTempUploadObjectUrl(tempUploadId)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [tempUploadId]);

  if (!src) {
    return <Paperclip className="size-3 shrink-0" />;
  }

  return (
    <span className="size-5 shrink-0 overflow-hidden rounded border">
      <img src={src} alt="" className="size-full object-cover" />
    </span>
  );
}

/* ================================================================== */
/*  Badge menu (immediate options on click)                           */
/* ================================================================== */

function BadgeMenu({
  ariaLabel,
  badge,
  items,
  onSelect,
  disabled = false,
}: {
  ariaLabel: string;
  badge: (chevron: ReactNode) => ReactNode;
  items: Array<{ value: string; label: string }>;
  onSelect: (value: string) => void;
  disabled?: boolean;
}) {
  const chevron = (
    <ChevronDown className="size-3 opacity-70" aria-hidden="true" />
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          aria-label={ariaLabel}
          className="inline-flex cursor-pointer rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {badge(chevron)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-w-72">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.value}
            onSelect={() => onSelect(item.value)}
          >
            <span className="truncate">{item.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ================================================================== */
/*  Chat channel switcher (embedded in TicketChatCard header)         */
/* ================================================================== */

function ChatChannelSwitcher({
  chatChannel,
  onChange,
}: {
  chatChannel: "conversation" | "internal";
  onChange: (channel: "conversation" | "internal") => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Chat channel"
      className="bg-muted/40 border-border/60 flex flex-wrap gap-1 rounded-lg border p-1"
    >
      <Button
        type="button"
        role="tab"
        aria-selected={chatChannel === "conversation"}
        size="sm"
        variant={chatChannel === "conversation" ? "default" : "ghost"}
        className="flex-1 shadow-xs sm:flex-none"
        onClick={() => onChange("conversation")}
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
        onClick={() => onChange("internal")}
      >
        Internal
        <span className="ml-1.5 text-[10px] font-normal opacity-80">
          Staff only
        </span>
      </Button>
    </div>
  );
}

/* ================================================================== */
/*  TicketChatCard                                                    */
/* ================================================================== */

function TicketChatCard({
  title,
  subtitle,
  channelSwitcher,
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
  mentionCandidates,
  accent = false,
  readOnly = false,
  readOnlyLabel,
}: {
  title: string;
  subtitle?: string;
  channelSwitcher?: ReactNode;
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
  mentionCandidates?: Array<{ user_id: number; name: string }>;
  accent?: boolean;
  readOnly?: boolean;
  readOnlyLabel?: string;
}) {
  const replyId = accent ? "internal-reply" : "reply";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wasPendingRef = useRef(false);
  const [pendingFiles, setPendingFiles] = useState<
    Array<{
      id: string | number;
      name: string;
      mime_type: string | null;
      size: number;
    }>
  >([]);
  const [previewAttachment, setPreviewAttachment] =
    useState<PreviewableAttachment | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

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
    if (wasPendingRef.current && !pending && !message.trim()) {
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

  function openPendingPreview(file: {
    id: string | number;
    name: string;
    mime_type: string | null;
    size: number;
  }) {
    const remote: RemoteFileAttachment = {
      id: file.id,
      name: file.name,
      file_name: file.name,
      mime_type: file.mime_type,
      size: file.size,
      fetchPreviewUrl: () => fetchTempUploadObjectUrl(file.id),
    };
    setPreviewAttachment(remote);
    setPreviewOpen(true);
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
              mime_type: upload.mime_type ?? file.type ?? null,
              size: upload.size ?? file.size,
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
    (message.trim().length > 0 || tempUploadIds.length > 0) &&
    !uploading &&
    !pending &&
    !readOnly;

  return (
    <Card
      className={
        accent
          ? "border-amber-500/35 bg-card/80 shadow-sm dark:border-amber-500/25"
          : "bg-card/80 shadow-sm "
      }
    >
      <Tabs defaultValue="conversation">
        <CardHeader className="border-b pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              {channelSwitcher ? (
                channelSwitcher
              ) : (
                <div className="space-y-1">
                  <CardTitle className="text-lg">{title}</CardTitle>
                  {subtitle ? (
                    <p className="text-muted-foreground text-xs">{subtitle}</p>
                  ) : null}
                </div>
              )}
              {channelSwitcher && subtitle ? (
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
          <CardContent className="p-3 sm:p-4">
            <div className="grid min-h-52 gap-3 md:grid-cols-3 md:gap-4">
              <div
                className={`order-1 flex min-h-52 max-h-52 flex-col rounded-md border ${readOnly ? "md:col-span-3" : "md:col-span-2"}`}
              >
                <div
                  ref={messagesScrollRef}
                  className="flex flex-1 flex-col gap-3 overflow-y-auto overscroll-y-contain p-3 sm:p-4"
                >
                  {messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={currentUserId > 0 && msg.user_id === currentUserId}
                      mentionLabels={mentionLabels}
                      ticketNumber={ticketNumber}
                      attachments={attachments}
                    />
                  ))}
                  {messages.length === 0 && (
                    <div className="text-muted-foreground py-6 text-center text-sm">
                      {emptyMessagesLabel}
                    </div>
                  )}
                  <div ref={messagesEndRef} aria-hidden="true" />
                </div>
              </div>

              {readOnly ? null : (
                <form
                  onSubmit={onSubmit}
                  className="bg-muted/10 order-2 flex flex-col gap-3 rounded-md border p-3 md:col-span-1"
                >
                  <Label htmlFor={replyId} className="sr-only">
                    {title}
                  </Label>
                  <Textarea
                    id={replyId}
                    value={message}
                    onChange={(e) => onMessageChange(e.target.value)}
                    placeholder={replyPlaceholder}
                    disabled={pending}
                    className="min-h-40 flex-1 resize-y shadow-xs"
                  />
                  {pendingFiles.length > 0 ? (
                    <ul className="flex flex-wrap gap-2">
                      {pendingFiles.map((file) => {
                        const kind = getAttachmentKind({
                          id: file.id,
                          name: file.name,
                          mime_type: file.mime_type,
                          size: file.size,
                        });

                        return (
                          <li
                            key={String(file.id)}
                            className="bg-muted/50 flex max-w-full items-center gap-1 rounded-md border px-2 py-1 text-xs"
                          >
                            <button
                              type="button"
                              className="flex min-w-0 flex-1 items-center gap-1 text-left"
                              onClick={() => openPendingPreview(file)}
                            >
                              {kind === "image" ? (
                                <PendingUploadThumbnail
                                  tempUploadId={file.id}
                                />
                              ) : (
                                <Paperclip className="size-3 shrink-0" />
                              )}
                              <span className="truncate">{file.name}</span>
                              <Eye className="text-muted-foreground size-3 shrink-0" />
                            </button>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground ml-0.5"
                              onClick={() => void removePendingFile(file.id)}
                              aria-label={`Remove ${file.name}`}
                            >
                              <X className="size-3" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                  <FilePreviewDialog
                    attachment={previewAttachment}
                    open={previewOpen}
                    onOpenChange={setPreviewOpen}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={TICKET_ATTACHMENT_ACCEPT_ATTR}
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                  <div className="mt-auto flex flex-wrap items-center gap-2">
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
                </form>
              )}
            </div>
            {readOnly && readOnlyLabel ? (
              <p className="text-muted-foreground mt-3 text-xs">
                {readOnlyLabel}
              </p>
            ) : null}
          </CardContent>
        </TabsContent>
        <TabsContent value="media" className="mt-0">
          <CardContent className="p-4">
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
