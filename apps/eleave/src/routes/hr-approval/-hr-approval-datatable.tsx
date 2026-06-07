import * as React from "react"

import DataTableSearchBar from "@/components/shared/datatable/DataTableSearchBar"
import DataTableServerPagination from "@/components/shared/datatable/DataTableServerPagination"
import { useDataTable, type RecordPagination } from "@/components/shared/datatable"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getEmployeeAvatarUrl,
  getEmployeeInitials,
} from "@/lib/employee-teacher-display"
import type { HrApprovalRow } from "@/lib/map-hr-approval-row"
import { OverallStatusBadge } from "@/routes/my-leave/-leave-status-badge"

function buildClientPagination(
  rows: HrApprovalRow[],
  page: number,
  perPage: number,
): RecordPagination {
  const total = rows.length
  const lastPage = Math.max(1, Math.ceil(total / perPage) || 1)
  const currentPage = Math.min(Math.max(page, 1), lastPage)
  const start = (currentPage - 1) * perPage
  const data = rows.slice(start, start + perPage)

  return {
    current_page: currentPage,
    data,
    first_page_url: "",
    from: total === 0 ? 0 : start + 1,
    last_page: lastPage,
    last_page_url: "",
    links: [],
    next_page_url: null,
    path: "",
    per_page: perPage,
    prev_page_url: null,
    to: total === 0 ? 0 : start + data.length,
    total,
  }
}

function matchesSearch(row: HrApprovalRow, keyword: string): boolean {
  const query = keyword.trim().toLowerCase()

  if (!query) {
    return true
  }

  const searchable = [
    row.employee,
    row.department,
    row.leaveType,
    row.dates,
    row.record.employee_no,
    String(row.days),
    row.status,
  ]
    .join(" ")
    .toLowerCase()

  return searchable.includes(query)
}

type HrApprovalDataTableProps = {
  rows: HrApprovalRow[]
  isLoading: boolean
  onViewDetails: (row: HrApprovalRow) => void
  selectedYear: string
  selectedStatus: string
}

export function HrApprovalDataTable({
  rows,
  isLoading,
  onViewDetails,
  selectedYear,
  selectedStatus,
}: HrApprovalDataTableProps) {
  const tableHook = useDataTable()
  const { keyword, page, rows: perPage, setPage } = tableHook

  React.useEffect(() => {
    setPage(1)
  }, [selectedYear, selectedStatus, setPage])

  const searchedRows = React.useMemo(
    () => rows.filter((row) => matchesSearch(row, keyword)),
    [keyword, rows],
  )

  const paginatedData = React.useMemo(
    () => buildClientPagination(searchedRows, page, perPage),
    [page, perPage, searchedRows],
  )

  const visibleRows = paginatedData.data as HrApprovalRow[]

  return (
    <div className="space-y-3">
      <DataTableSearchBar
        tanstack={{ hook: tableHook }}
        mode="debounce"
        data={{ placeholder: "Search requests..." }}
        styles={{ input: "h-9 text-sm" }}
      />

      {isLoading ? (
        Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-xl" />
        ))
      ) : (
        visibleRows.map((row) => {
          const avatarUrl = getEmployeeAvatarUrl(row.record.employee_teacher)

          return (
            <div
              key={row.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-4 transition-colors hover:bg-slate-50 sm:px-5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={row.employee} />
                  ) : null}
                  <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-700">
                    {getEmployeeInitials(row.record.employee_teacher)}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-1">
                  <p className="text-sm font-semibold">{row.employee}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {row.department} • {row.leaveType} • {row.dates} • {row.days}{" "}
                    day{row.days > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <OverallStatusBadge status={row.status} />
                <Button type="button" size="sm" onClick={() => onViewDetails(row)}>
                  View Details
                </Button>
              </div>
            </div>
          )
        })
      )}

      {!isLoading && visibleRows.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm">
          No HR requests match the selected filters.
        </div>
      ) : null}

      {!isLoading ? (
        <DataTableServerPagination tanstack={{ hook: tableHook }} data={paginatedData} />
      ) : null}
    </div>
  )
}
