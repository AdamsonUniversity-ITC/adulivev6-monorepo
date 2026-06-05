import { Badge } from "@repo/ui/components/badge"
import { DataTable } from "@repo/ui/custom/datatable/datatable"
import { DataTableColumnHeader } from "@repo/ui/custom/datatable/datatable-column-header"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select"
import { useNavigate } from "@tanstack/react-router"
import type { ColumnDef, PaginationState, SortingState } from "@tanstack/react-table"
import { format, parseISO } from "date-fns"
import { Eye, Pencil } from "lucide-react"
import * as React from "react"

import {
  getLeaveFiledYears,
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_OPTIONS,
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
  return LEAVE_STATUS_LABELS[status]
}

function StatusBadge({ status }: { status: LeaveRequestStatus }) {
  switch (status) {
    case "approved":
      return <Badge className="font-normal">{statusLabel(status)}</Badge>
    case "partially_approved":
      return (
        <Badge variant="secondary" className="font-normal">
          {statusLabel(status)}
        </Badge>
      )
    case "disapproved":
      return (
        <Badge variant="destructive" className="font-normal">
          {statusLabel(status)}
        </Badge>
      )
    case "cancelled":
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
    accessorKey: "filed_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Leave Type" />
    ),
    meta: { label: "Leave Type" },
    cell: ({ row }) => {
      const { leave_type, filed_at } = row.original
      return (
        <div className="space-y-1">
          <span className="text-sm font-medium">{leave_type}</span>
          <p className="text-muted-foreground text-xs tabular-nums">
            Filed {formatFiledAt(filed_at)}
          </p>
        </div>
      )
    },
  },
  {
    accessorKey: "date_from",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Leave Details" />
    ),
    meta: { label: "Leave Details" },
    cell: ({ row }) => {
      const { date_from, date_to, reason } = row.original
      return (
        <div className="max-w-md space-y-1">
          <p className="text-sm tabular-nums">
            {formatDate(date_from)} – {formatDate(date_to)}
          </p>
          <p className="text-muted-foreground line-clamp-2 text-sm" title={reason}>
            {reason}
          </p>
        </div>
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
]

function filterAndSortRows(
  rows: LeaveRequestRow[],
  search: string,
  sorting: SortingState,
  year: string,
  status: string,
): LeaveRequestRow[] {
  let result = [...rows]

  const query = search.trim().toLowerCase()
  if (query) {
    result = result.filter(
      (row) =>
        row.leave_type.toLowerCase().includes(query) ||
        row.status.toLowerCase().includes(query) ||
        LEAVE_STATUS_LABELS[row.status].toLowerCase().includes(query) ||
        row.reason.toLowerCase().includes(query) ||
        row.address.toLowerCase().includes(query),
    )
  }

  if (year !== "all") {
    const selectedYear = Number(year)
    result = result.filter((row) => {
      const filedYear = new Date(row.filed_at).getFullYear()
      return filedYear === selectedYear
    })
  }

  if (status !== "all") {
    result = result.filter((row) => row.status === status)
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

const YEAR_OPTIONS = getLeaveFiledYears(MOCK_LEAVE_REQUESTS)

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
  const [yearFilter, setYearFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")

  const sort = sorting[0]
  const sortId = sort?.id ?? "filed_at"
  const order = sort?.desc ? "desc" : "asc"

  React.useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }, [sortId, order, search, yearFilter, statusFilter])

  const filteredRows = React.useMemo(
    () =>
      filterAndSortRows(
        MOCK_LEAVE_REQUESTS,
        search,
        sorting,
        yearFilter,
        statusFilter,
      ),
    [search, sorting, yearFilter, statusFilter],
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
          <div className="flex flex-wrap items-center gap-2">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger size="sm" className="w-[7.5rem]" aria-label="Filter by year">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {YEAR_OPTIONS.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                size="sm"
                className="w-[11.5rem]"
                aria-label="Filter by status"
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {LEAVE_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
