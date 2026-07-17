import { Button } from "@repo/ui/components/button"
import type { ColumnDef, Row } from "@tanstack/react-table"
import { X } from "lucide-react"
import * as React from "react"

import DataTable from "@/components/shared/datatable/DataTable"
import type {
  RecordPagination,
  TanstackType,
} from "@/components/shared/datatable/types"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  formatEmployeeNameLastFirst,
  getAvatarUrlFromEmpNo,
  getEmployeeInitials,
} from "@/lib/employee-teacher-display"
import type { PaginatedLeaveApplicationsResponse } from "@/lib/leave-applications-api"
import {
  mapLeaveApplicationsToFiledLeaveReportRows,
  type FiledLeaveReportRow,
} from "@/lib/map-filed-leave-report-row"
import { PendingStatusBadge } from "@/routes/my-leave/-leave-status-badge"

const NOT_PRINTED_ROW_CLASS =
  "bg-amber-50/80 hover:bg-amber-50 border-l-2 border-l-amber-400"

function mapToRecordPagination(
  response: PaginatedLeaveApplicationsResponse | undefined,
  rows: FiledLeaveReportRow[],
): RecordPagination {
  const meta = response?.meta
  const currentPage = meta?.current_page ?? 1
  const perPage = meta?.per_page ?? rows.length
  const total = meta?.total ?? rows.length
  const from = total === 0 ? 0 : (currentPage - 1) * perPage + 1
  const to = total === 0 ? 0 : from + rows.length - 1

  return {
    current_page: currentPage,
    data: rows,
    first_page_url: "",
    from,
    last_page: meta?.last_page ?? 1,
    last_page_url: "",
    links: [],
    next_page_url: null,
    path: "",
    per_page: perPage,
    prev_page_url: null,
    to,
    total,
  }
}

type FiledLeaveAfterCutoffDataTableProps = {
  tanstack: TanstackType
  response: PaginatedLeaveApplicationsResponse | undefined
  leaveTypeNames: Map<number, string>
  isLoading?: boolean
  isError?: boolean
  dateFrom: string
  dateTo: string
  hasPrintHistory: boolean
  printedApplicationIds: ReadonlySet<number>
  remainingCount: number
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  onClearFilters: () => void
  onRowClick: (row: FiledLeaveReportRow) => void
}

export function FiledLeaveAfterCutoffDataTable({
  tanstack,
  response,
  leaveTypeNames,
  isLoading = false,
  isError = false,
  dateFrom,
  dateTo,
  hasPrintHistory,
  printedApplicationIds,
  remainingCount,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
  onRowClick,
}: FiledLeaveAfterCutoffDataTableProps) {
  const hasDateRange = dateFrom !== "" && dateTo !== ""
  const showPrintHighlight = hasDateRange && hasPrintHistory

  const isNotPrintedRow = React.useCallback(
    (row: FiledLeaveReportRow) =>
      showPrintHighlight && !printedApplicationIds.has(Number(row.id)),
    [printedApplicationIds, showPrintHighlight],
  )

  const rows = React.useMemo(
    () => mapLeaveApplicationsToFiledLeaveReportRows(response?.data ?? [], leaveTypeNames),
    [leaveTypeNames, response?.data],
  )

  const tableData = React.useMemo(
    () => mapToRecordPagination(response, rows),
    [response, rows],
  )

  const columns = React.useMemo<ColumnDef<FiledLeaveReportRow>[]>(
    () => [
      {
        id: "employee",
        header: "Employee",
        cell: ({ row }) => {
          const item = row.original
          const teacher = item.record.employee_teacher
          const avatarUrl = getAvatarUrlFromEmpNo(item.employeeNo)
          const notPrinted = isNotPrintedRow(item)
          const displayName = formatEmployeeNameLastFirst(teacher, item.employee)

          return (
            <div className="flex items-center gap-3 py-1">
              <Avatar className="size-10 shrink-0">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
                <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-700">
                  {getEmployeeInitials(teacher, item.employeeNo)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{displayName}</p>
                  {notPrinted ? (
                    <PendingStatusBadge className="text-[10px]">
                      Not printed
                    </PendingStatusBadge>
                  ) : null}
                </div>
                <p className="text-muted-foreground text-xs tabular-nums">
                  {item.employeeNo}
                </p>
                <p className="text-muted-foreground text-xs">{item.department}</p>
              </div>
            </div>
          )
        },
      },
      {
        id: "leave",
        header: "Leave",
        cell: ({ row }) => {
          const item = row.original

          return (
            <div className="flex flex-col gap-0.5 py-1">
              <p className="text-sm">{item.leaveType}</p>
              <p className="text-muted-foreground text-xs">
                {item.dates} · {item.days} day{item.days === 1 ? "" : "s"}
              </p>
            </div>
          )
        },
      },
      {
        id: "request",
        header: "Request",
        cell: ({ row }) => {
          const item = row.original

          return (
            <div className="flex max-w-xs flex-col gap-0.5 py-1">
              <p className="line-clamp-1 text-sm" title={item.record.reason}>
                {item.record.reason?.trim() || "—"}
              </p>
              <p
                className="text-muted-foreground line-clamp-1 text-xs"
                title={item.approvalsLabel}
              >
                {item.approvalsLabel}
              </p>
            </div>
          )
        },
      },
      {
        id: "hr_remarks",
        header: "HR remarks",
        cell: ({ row }) => {
          const item = row.original
          const label = item.hrRemarksLabel || "—"

          return (
            <p className="line-clamp-2 max-w-xs text-sm" title={label}>
              {label}
            </p>
          )
        },
      },
    ],
    [isNotPrintedRow],
  )

  const hasActiveFilters =
    tanstack.hook.keyword.trim() !== "" || dateFrom !== "" || dateTo !== ""

  const handleRowClick = React.useCallback(
    (row: Row<FiledLeaveReportRow>) => {
      onRowClick(row.original)
    },
    [onRowClick],
  )

  const getRowClassName = React.useCallback(
    (row: Row<FiledLeaveReportRow>) => {
      if (isNotPrintedRow(row.original)) {
        return NOT_PRINTED_ROW_CLASS
      }

      return undefined
    },
    [isNotPrintedRow],
  )

  if (isError) {
    return (
      <div className="text-destructive rounded-md border border-dashed px-4 py-10 text-center text-sm">
        Unable to load approved leave after cut-off report. Please try again.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Filters
          </p>
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-2 px-2"
              onClick={onClearFilters}
            >
              <X className="size-4" />
              Clear filters
            </Button>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
              Leave date from
            </span>
            <Input
              type="date"
              value={dateFrom}
              onChange={(event) => onDateFromChange(event.target.value)}
              className="h-9 rounded-lg border-slate-300 bg-background shadow-sm"
            />
          </label>

          <label className="space-y-1">
            <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
              Leave date to
            </span>
            <Input
              type="date"
              value={dateTo}
              onChange={(event) => onDateToChange(event.target.value)}
              className="h-9 rounded-lg border-slate-300 bg-background shadow-sm"
            />
          </label>
        </div>

        {showPrintHighlight && remainingCount > 0 ? (
          <p className="text-muted-foreground mt-3 text-xs">
            Amber rows are approved applications not yet printed for this date range.
          </p>
        ) : null}
      </section>

      <DataTable<FiledLeaveReportRow>
        tanstack={tanstack}
        data={tableData}
        states={{ isFetching: isLoading }}
        config={{
          search: true,
          pagination: true,
          searchMode: "debounce",
          searchDebounceMs: 300,
          searchPlaceholder: "Search by name or employee number...",
          fn: {
            onClick: handleRowClick,
            getRowClassName,
          },
        }}
        columns={columns}
        styles={{
          searchbar: "pl-8",
        }}
      />

      {!isLoading ? (
        <p className="text-muted-foreground text-sm">
          {tableData.total} leave application{tableData.total === 1 ? "" : "s"}
        </p>
      ) : null}
    </div>
  )
}
