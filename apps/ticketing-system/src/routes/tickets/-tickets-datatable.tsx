import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ColumnDef,
  PaginationState,
  RowSelectionState,
} from "@tanstack/react-table";
import * as React from "react";

import { PersonIdentity } from "@/components/person-identity";
import {
  PriorityBadge,
  StatusBadge,
  UnreadIndicators,
} from "@/components/ticket-badges";
import {
  bulkAssignTickets,
  bulkChangeTicketStatus,
  fetchCurrentBoard,
  fetchTickets,
  type Ticket,
} from "@/lib/aduts-api";
import { isPlatformHost } from "@/lib/adutsHost";
import { getAxiosMessage } from "@/lib/axios-status";
import { formatPriority, formatStatus } from "@/lib/format-labels";
import { Button } from "@repo/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { DataTable } from "@repo/ui/custom/datatable/datatable";
import { DataTableColumnHeader } from "@repo/ui/custom/datatable/datatable-column-header";
import { toast } from "@repo/ui/exports";

import {
  DEFAULT_STATUS_FILTER,
  EMPTY_STATUS_FILTER,
  type TicketsSearch,
} from "./-tickets-search";

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

export type TicketsMetrics = {
  open: number;
  in_progress: number;
  pending_approval: number;
  resolved: number;
  closed: number;
  unread_replies: number;
  transferred: number;
  awaiting_ack: number;
};

type TicketsDatatableProps = {
  search: TicketsSearch;
  onSearchChange: (patch: Partial<TicketsSearch>) => void;
  onMetricsChange?: (metrics: TicketsMetrics | null) => void;
};

export function TicketsDatatable({
  search,
  onSearchChange,
  onMetricsChange,
}: TicketsDatatableProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const platform = isPlatformHost();
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [bulkStatus, setBulkStatus] = React.useState("");
  const [bulkCancelReasonId, setBulkCancelReasonId] = React.useState("");
  const [bulkAssignee, setBulkAssignee] = React.useState("");

  const status = search.status ?? DEFAULT_STATUS_FILTER;
  const keyword = search.keyword ?? "";
  const priority = search.priority ?? "";
  const sectionId = search.section_id ? String(search.section_id) : "";
  const assignedTo = search.assigned_to ? String(search.assigned_to) : "";
  const categoryId = search.category_id ? String(search.category_id) : "";
  const transferred = search.transferred === true;
  const awaitingAck = search.awaiting_ack === true;
  // No tab lit at all means nothing matches. Transferred is not a status, so if
  // that tab is still lit it stands on its own across every status instead.
  // Acknowledge omits status entirely so the default open/in_progress filter
  // does not AND away resolved tickets waiting for the requester.
  const statusParam = awaitingAck
    ? undefined
    : status === EMPTY_STATUS_FILTER && transferred
      ? undefined
      : status;
  const pagination = React.useMemo<PaginationState>(
    () => ({
      pageIndex: Math.max(0, (search.page ?? 1) - 1),
      pageSize: search.rows ?? 15,
    }),
    [search.page, search.rows],
  );

  const boardQuery = useQuery({
    queryKey: ["aduts", "board"],
    queryFn: fetchCurrentBoard,
    enabled: !platform,
  });

  const isStaff = boardQuery.data?.access?.is_staff === true;

  // Filter options are limited to the sections the user actually works in.
  // null/undefined means unrestricted (board or global admin).
  const scopedSectionIds = boardQuery.data?.access?.scoped_section_ids;

  const scopedSections = React.useMemo(() => {
    const sections = boardQuery.data?.sections ?? [];
    if (!scopedSectionIds) return sections;
    const allowed = new Set(scopedSectionIds);
    return sections.filter((section) => allowed.has(section.id));
  }, [boardQuery.data?.sections, scopedSectionIds]);

  const scopedCategories = React.useMemo(() => {
    const categories = boardQuery.data?.categories ?? [];
    if (!scopedSectionIds) return categories;
    const allowed = new Set(scopedSectionIds);
    return categories.filter(
      (category) =>
        category.section_id != null && allowed.has(category.section_id),
    );
  }, [boardQuery.data?.categories, scopedSectionIds]);

  const cancellationReasons = boardQuery.data?.cancellation_reasons ?? [];

  React.useEffect(() => {
    setRowSelection({});
  }, [
    status,
    keyword,
    priority,
    sectionId,
    assignedTo,
    categoryId,
    transferred,
    awaitingAck,
    pagination.pageIndex,
    pagination.pageSize,
  ]);

  const ticketsQuery = useQuery({
    queryKey: [
      "aduts",
      "tickets",
      status,
      priority,
      sectionId,
      assignedTo,
      categoryId,
      keyword,
      transferred,
      awaitingAck,
      pagination.pageIndex,
      pagination.pageSize,
    ],
    queryFn: () =>
      fetchTickets({
        status: statusParam || undefined,
        priority: priority || undefined,
        section_id: sectionId || undefined,
        assigned_to: assignedTo || undefined,
        category_id: categoryId || undefined,
        keyword: keyword.trim() || undefined,
        transferred: transferred && !awaitingAck ? 1 : undefined,
        awaiting_ack: awaitingAck ? 1 : undefined,
        page: pagination.pageIndex + 1,
        rows: pagination.pageSize,
      }),
  });

  React.useEffect(() => {
    const raw = ticketsQuery.data?.metrics;
    if (!raw) {
      onMetricsChange?.(null);
      return;
    }
    onMetricsChange?.({
      open: raw.open,
      in_progress: raw.in_progress,
      pending_approval: raw.pending_approval,
      resolved: raw.resolved,
      closed: raw.closed,
      unread_replies: raw.unread_replies,
      transferred: raw.transferred,
      awaiting_ack: raw.awaiting_ack ?? 0,
    });
  }, [onMetricsChange, ticketsQuery.data?.metrics]);

  const rows = ticketsQuery.data?.data ?? [];
  const total = ticketsQuery.data?.meta.total ?? 0;

  const selectedTickets = React.useMemo(() => {
    const selectedIds = new Set(
      Object.entries(rowSelection)
        .filter(([, selected]) => selected)
        .map(([id]) => id),
    );
    return rows.filter((row) => selectedIds.has(String(row.id)));
  }, [rowSelection, rows]);

  const sectionMembers = React.useMemo(() => {
    const byId = new Map<number, { user_id: number; name?: string | null }>();
    for (const section of scopedSections) {
      for (const member of section.members ?? []) {
        byId.set(member.user_id, member);
      }
    }
    return Array.from(byId.values()).sort((a, b) =>
      (a.name ?? `User ${a.user_id}`).localeCompare(
        b.name ?? `User ${b.user_id}`,
      ),
    );
  }, [scopedSections]);

  const invalidateTickets = () => {
    void queryClient.invalidateQueries({ queryKey: ["aduts", "tickets"] });
  };

  const bulkStatusMutation = useMutation({
    mutationFn: (nextStatus: string) =>
      bulkChangeTicketStatus(
        selectedTickets.map((t) => t.ticket_number),
        nextStatus,
        bulkCancelReasonId
          ? { reasonId: Number(bulkCancelReasonId) }
          : undefined,
      ),
    onSuccess: () => {
      setRowSelection({});
      setBulkStatus("");
      setBulkCancelReasonId("");
      invalidateTickets();
      toast.success("Status updated for selected tickets.");
    },
    onError: (error) =>
      toast.error(
        getAxiosMessage(error, "Could not update status for all tickets."),
      ),
  });

  const bulkAssignMutation = useMutation({
    mutationFn: (assigneeId: number) =>
      bulkAssignTickets(
        selectedTickets.map((t) => t.ticket_number),
        assigneeId,
      ),
    onSuccess: () => {
      setRowSelection({});
      setBulkAssignee("");
      invalidateTickets();
      toast.success("Assignee updated for selected tickets.");
    },
    onError: () => toast.error("Could not assign all selected tickets."),
  });

  const patchSearch = React.useCallback(
    (patch: Partial<TicketsSearch>) => {
      onSearchChange({
        ...patch,
        page: patch.page ?? 1,
      });
    },
    [onSearchChange],
  );

  const columns = React.useMemo<ColumnDef<Ticket>[]>(
    () => [
      {
        accessorKey: "ticket_number",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Ticket" />
        ),
        meta: { label: "Ticket" },
        cell: ({ row }) => {
          const title = row.original.title;
          return (
            <div className="min-w-0 max-w-[16rem] space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-medium">
                  {row.original.ticket_number}
                </span>
                <UnreadIndicators
                  conversation={row.original.unread_count}
                  internal={row.original.unread_internal_count}
                  mentions={row.original.unread_mentions_count}
                />
              </div>
              <p className="truncate text-sm">{title}</p>
            </div>
          );
        },
      },
      {
        id: "requester",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Requestor" />
        ),
        meta: { label: "Requestor" },
        cell: ({ row }) =>
          row.original.requester ? (
            <PersonIdentity
              person={row.original.requester}
              size="sm"
              secondaryMode="section"
            />
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          ),
      },
      {
        id: "assignee",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Assigned to" />
        ),
        meta: { label: "Assigned to" },
        cell: ({ row }) =>
          row.original.assignee ? (
            <PersonIdentity
              person={row.original.assignee}
              size="sm"
              secondaryMode="section"
            />
          ) : (
            <span className="text-muted-foreground text-sm">Unassigned</span>
          ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        meta: { label: "Status" },
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "priority",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Priority" />
        ),
        meta: { label: "Priority" },
        cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Created" />
        ),
        meta: { label: "Created" },
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm whitespace-nowrap">
            {formatDateTime(row.original.created_at)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-3">
      {selectedTickets.length > 0 ? (
        <div className="bg-muted/40 flex flex-wrap items-center gap-2 rounded-lg border p-2">
          <span className="text-muted-foreground px-1 text-sm">
            {selectedTickets.length} selected
          </span>
          <div className="flex items-center gap-2">
            <Select
              value={bulkStatus || undefined}
              onValueChange={(next) => {
                setBulkStatus(next);
                if (next !== "closed") setBulkCancelReasonId("");
              }}
            >
              <SelectTrigger
                size="sm"
                className="w-[9rem]"
                aria-label="Bulk status"
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {["open", "in_progress", "resolved", "closed"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {formatStatus(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Closing live work is a cancellation, so the server demands a reason. */}
            {bulkStatus === "closed" ? (
              <Select
                value={bulkCancelReasonId || undefined}
                onValueChange={setBulkCancelReasonId}
              >
                <SelectTrigger
                  size="sm"
                  className="w-[13rem]"
                  aria-label="Cancellation reason"
                >
                  <SelectValue placeholder="Reason" />
                </SelectTrigger>
                <SelectContent>
                  {cancellationReasons.map((reason) => (
                    <SelectItem key={reason.id} value={String(reason.id)}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <Button
              type="button"
              size="sm"
              disabled={
                !bulkStatus ||
                (bulkStatus === "closed" && !bulkCancelReasonId) ||
                bulkStatusMutation.isPending
              }
              onClick={() => bulkStatusMutation.mutate(bulkStatus)}
            >
              Apply
            </Button>
          </div>
          {!platform && isStaff ? (
            <div className="flex items-center gap-2">
              <Select
                value={bulkAssignee || undefined}
                onValueChange={setBulkAssignee}
              >
                <SelectTrigger
                  size="sm"
                  className="w-[11rem]"
                  aria-label="Bulk assignee"
                >
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  {sectionMembers.map((member) => (
                    <SelectItem
                      key={member.user_id}
                      value={String(member.user_id)}
                    >
                      {member.name ?? `User #${member.user_id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="sm"
                disabled={!bulkAssignee || bulkAssignMutation.isPending}
                onClick={() => bulkAssignMutation.mutate(Number(bulkAssignee))}
              >
                Assign
              </Button>
            </div>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setRowSelection({})}
          >
            Clear
          </Button>
        </div>
      ) : null}

      <DataTable<Ticket>
        columns={columns}
        data={rows}
        getRowId={(row) => String(row.id)}
        getRowProps={(row) => ({
          "data-ticket-number": row.original.ticket_number,
        })}
        selection={{
          enabled: true,
          state: rowSelection,
          onChange: setRowSelection,
        }}
        onRowClick={(row) =>
          void navigate({
            to: "/tickets/$ticketNumber",
            params: { ticketNumber: row.original.ticket_number },
          })
        }
        server={{
          pagination: {
            rowCount: total,
            state: pagination,
            onChange: (updater) => {
              const next =
                typeof updater === "function" ? updater(pagination) : updater;
              patchSearch({
                page: next.pageIndex + 1,
                rows: next.pageSize,
              });
            },
            pageSizeOptions: [10, 15, 20, 30, 50],
          },
          search: {
            value: keyword,
            onChange: (value) => patchSearch({ keyword: value || undefined }),
          },
        }}
        toolbar={{
          searchPlaceholder: "Search ticket #, title, or requestor…",
          slot: (
            <div className="flex flex-wrap items-center gap-3">
              {isStaff || platform ? (
                <Select
                  value={priority || "all"}
                  onValueChange={(value) =>
                    patchSearch({
                      priority: value === "all" ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger
                    size="sm"
                    className="w-[9rem]"
                    aria-label="Filter by priority"
                  >
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    {["low", "medium", "high", "urgent"].map((p) => (
                      <SelectItem key={p} value={p}>
                        {formatPriority(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}

              {!platform && isStaff ? (
                <>
                  <Select
                    value={sectionId || "all"}
                    onValueChange={(value) =>
                      patchSearch({
                        section_id: value === "all" ? undefined : Number(value),
                      })
                    }
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-[10rem]"
                      aria-label="Filter by section"
                    >
                      <SelectValue placeholder="Section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sections</SelectItem>
                      {scopedSections.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.section_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={assignedTo || "all"}
                    onValueChange={(value) =>
                      patchSearch({
                        assigned_to:
                          value === "all" ? undefined : Number(value),
                      })
                    }
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-[11rem]"
                      aria-label="Filter by assignee"
                    >
                      <SelectValue placeholder="Assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All assignees</SelectItem>
                      {sectionMembers.map((member) => (
                        <SelectItem
                          key={member.user_id}
                          value={String(member.user_id)}
                        >
                          {member.name ?? `User #${member.user_id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {scopedCategories.length > 0 ? (
                    <Select
                      value={categoryId || "all"}
                      onValueChange={(value) =>
                        patchSearch({
                          category_id:
                            value === "all" ? undefined : Number(value),
                        })
                      }
                    >
                      <SelectTrigger
                        size="sm"
                        className="w-[10rem]"
                        aria-label="Filter by category"
                      >
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {scopedCategories.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                </>
              ) : null}
            </div>
          ),
        }}
        status={{
          loading: ticketsQuery.isLoading || ticketsQuery.isFetching,
          error: ticketsQuery.isError,
          emptyMessage: "No tickets found. Try adjusting filters or search.",
          errorMessage: "Failed to load tickets.",
        }}
      />
    </div>
  );
}
