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
  UnreadBadge,
} from "@/components/ticket-badges";
import {
  bulkAssignTickets,
  bulkChangeTicketStatus,
  fetchCurrentBoard,
  fetchTickets,
  type Ticket,
} from "@/lib/aduts-api";
import { isPlatformHost } from "@/lib/adutsHost";
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

import type { TicketsSearch } from "./index";

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
  resolved: number;
  closed: number;
  unread_replies: number;
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
  const [bulkAssignee, setBulkAssignee] = React.useState("");

  const status = search.status ?? "pending";
  const keyword = search.keyword ?? "";
  const priority = search.priority ?? "";
  const sectionId = search.section_id ? String(search.section_id) : "";
  const assignedTo = search.assigned_to ? String(search.assigned_to) : "";
  const categoryId = search.category_id ? String(search.category_id) : "";
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

  React.useEffect(() => {
    setRowSelection({});
  }, [
    status,
    keyword,
    priority,
    sectionId,
    assignedTo,
    categoryId,
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
      pagination.pageIndex,
      pagination.pageSize,
    ],
    queryFn: () =>
      fetchTickets({
        status: status || undefined,
        priority: priority || undefined,
        section_id: sectionId || undefined,
        assigned_to: assignedTo || undefined,
        category_id: categoryId || undefined,
        keyword: keyword.trim() || undefined,
        page: pagination.pageIndex + 1,
        rows: pagination.pageSize,
      }),
  });

  React.useEffect(() => {
    onMetricsChange?.(ticketsQuery.data?.metrics ?? null);
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
    const sections = boardQuery.data?.sections ?? [];
    const byId = new Map<number, { user_id: number; name?: string | null }>();
    for (const section of sections) {
      for (const member of section.members ?? []) {
        byId.set(member.user_id, member);
      }
    }
    return Array.from(byId.values()).sort((a, b) =>
      (a.name ?? `User ${a.user_id}`).localeCompare(
        b.name ?? `User ${b.user_id}`,
      ),
    );
  }, [boardQuery.data?.sections]);

  const invalidateTickets = () => {
    void queryClient.invalidateQueries({ queryKey: ["aduts", "tickets"] });
  };

  const bulkStatusMutation = useMutation({
    mutationFn: (nextStatus: string) =>
      bulkChangeTicketStatus(
        selectedTickets.map((t) => t.ticket_number),
        nextStatus,
      ),
    onSuccess: () => {
      setRowSelection({});
      setBulkStatus("");
      invalidateTickets();
      toast.success("Status updated for selected tickets.");
    },
    onError: () => toast.error("Could not update status for all tickets."),
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
          const unread = row.original.unread_count ?? 0;
          return (
            <div className="min-w-0 max-w-[16rem] space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-medium">
                  {row.original.ticket_number}
                </span>
                {unread > 0 ? <UnreadBadge count={unread} /> : null}
              </div>
              <p className="truncate text-sm">{title}</p>
            </div>
          );
        },
      },
      {
        id: "requester",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Requester" />
        ),
        meta: { label: "Requester" },
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
              onValueChange={setBulkStatus}
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
            <Button
              type="button"
              size="sm"
              disabled={!bulkStatus || bulkStatusMutation.isPending}
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
          searchPlaceholder: "Search ticket # or title…",
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
                      {(boardQuery.data?.sections ?? []).map((s) => (
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

                  {(boardQuery.data?.categories?.length ?? 0) > 0 ? (
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
                        {(boardQuery.data?.categories ?? []).map((c) => (
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
