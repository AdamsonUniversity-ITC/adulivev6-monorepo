import { Badge } from "@repo/ui/components/badge"
import { Button } from "@repo/ui/components/button"
import { DataTable } from "@repo/ui/custom/datatable/datatable"
import { DataTableColumnHeader } from "@repo/ui/custom/datatable/datatable-column-header"
import { Link, useNavigate } from "@tanstack/react-router"
import type { ColumnDef, PaginationState, SortingState } from "@tanstack/react-table"
import { format, parseISO } from "date-fns"
import { Eye, Pencil, Plus } from "lucide-react"
import * as React from "react"

import {
  MOCK_LEAVE_REQUESTS,
  type LeaveRequestRow,
  type LeaveRequestStatus,
} from "./-leave-mock-data"

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
})

function formatDate(value: string): string {
  try {
    return format(parseISO(value), "MMM d, yyyy")
  } catch {
    return value
  }
}

function formatFiledAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return dateFormatter.format(d)
}

function statusLabel(status: LeaveRequestStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function StatusBadge({ status }: { status: LeaveRequestStatus }) {
  switch (status) {
    case "approved":
      return <Badge className="font-normal">{statusLabel(status)}</Badge>
    case "rejected":
      return (
        <Badge variant="destructive" className="font-normal">
          {statusLabel(status)}
        </Badge>
      )
    case "draft":
      return (
        <Badge variant="outline" className="font-normal">
          {statusLabel(status)}
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary" className="font-normal">
          {statusLabel(status)}
        </Badge>
      )
  }
}

const columns: ColumnDef<LeaveRequestRow>[] = [
  {
    accessorKey: "leave_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Leave Type" />
    ),
    meta: { label: "Leave Type" },
    cell: ({ getValue }) => (
      <span className="text-sm font-medium">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "date_from",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date From" />
    ),
    meta: { label: "Date From" },
    cell: ({ getValue }) => (
      <span className="text-sm tabular-nums">
        {formatDate(getValue() as string)}
      </span>
    ),
  },
  {
    accessorKey: "date_to",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date To" />
    ),
    meta: { label: "Date To" },
    cell: ({ getValue }) => (
      <span className="text-sm tabular-nums">
        {formatDate(getValue() as string)}
      </span>
    ),
  },
  {
    accessorKey: "reason",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reason" />
    ),
    meta: { label: "Reason" },
    cell: ({ getValue }) => {
      const value = getValue() as string
      return (
        <span className="max-w-56 truncate text-sm" title={value}>
          {value}
        </span>
      )
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    meta: { label: "Status" },
    cell: ({ getValue }) => (
      <StatusBadge status={getValue() as LeaveRequestStatus} />
    ),
  },
  {
    accessorKey: "filed_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Filed" />
    ),
    meta: { label: "Filed" },
    cell: ({ getValue }) => (
      <span className="text-muted-foreground text-sm">
        {formatFiledAt(getValue() as string)}
      </span>
    ),
  },
]

function filterAndSortRows(
  rows: LeaveRequestRow[],
  search: string,
  sorting: SortingState,
): LeaveRequestRow[] {
  let result = [...rows]

  const query = search.trim().toLowerCase()
  if (query) {
    result = result.filter(
      (row) =>
        row.leave_type.toLowerCase().includes(query) ||
        row.status.toLowerCase().includes(query) ||
        row.reason.toLowerCase().includes(query) ||
        row.address.toLowerCase().includes(query),
    )
  }

  const sort = sorting[0]
  if (sort) {
    const { id, desc } = sort
    result.sort((a, b) => {
      const av = a[id as keyof LeaveRequestRow]
      const bv = b[id as keyof LeaveRequestRow]
      if (av === bv) return 0
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = String(av).localeCompare(String(bv), undefined, {
        numeric: true,
      })
      return desc ? -cmp : cmp
    })
  }

  return result
}

export function MyLeaveDataTable() {
  const navigate = useNavigate()
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "filed_at", desc: true },
  ])
  const [search, setSearch] = React.useState("")

  const sort = sorting[0]
  const sortId = sort?.id ?? "filed_at"
  const order = sort?.desc ? "desc" : "asc"

  React.useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }, [sortId, order, search])

  const filteredRows = React.useMemo(
    () => filterAndSortRows(MOCK_LEAVE_REQUESTS, search, sorting),
    [search, sorting],
  )

  const pagedRows = React.useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize
    return filteredRows.slice(start, start + pagination.pageSize)
  }, [filteredRows, pagination.pageIndex, pagination.pageSize])

  return (
    <DataTable<LeaveRequestRow>
      columns={columns}
      data={pagedRows}
      getRowId={(row) => row.id}
      onRowClick={(row) =>
        void navigate({
          to: "/my-leave/view-leave",
        })
      }
      server={{
        pagination: {
          rowCount: filteredRows.length,
          state: pagination,
          onChange: setPagination,
          pageSizeOptions: [10, 20, 30],
        },
        sorting: {
          state: sorting,
          onChange: setSorting,
        },
        search: { value: search, onChange: setSearch },
      }}
      toolbar={{
        searchPlaceholder: "Search leave type, status, reason…",
        slot: (
          <Button size="sm" asChild>
            <Link to="/my-leave/leave-form/{-$leaveId}">
              <Plus className="size-4" />
              Apply for Leave
            </Link>
          </Button>
        ),
      }}
      rowActions={{
        label: "Actions",
        actions: [
          {
            label: (
              <>
                <Eye className="size-4" />
                View
              </>
            ),
            onSelect: () => {
              void navigate({ to: "/my-leave/view-leave" })
            },
          },
          {
            label: (
              <>
                <Pencil className="size-4" />
                Edit
              </>
            ),
            onSelect: (row) => {
              void navigate({
                to: "/my-leave/leave-form/{-$leaveId}",
                params: { leaveId: row.original.id },
              })
            },
            hidden: (row) => row.original.status === "approved",
          },
        ],
      }}
      status={{
        emptyMessage: "No leave requests yet. Apply for leave to get started.",
      }}
    />
  )
}
