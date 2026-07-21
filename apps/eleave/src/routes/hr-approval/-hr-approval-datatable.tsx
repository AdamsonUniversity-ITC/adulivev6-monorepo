import { Button } from "@repo/ui/components/button"
import * as React from "react"

import DataTableSearchBar from "@/components/shared/datatable/DataTableSearchBar"
import DataTableServerPagination from "@/components/shared/datatable/DataTableServerPagination"
import type {
  RecordPagination,
  TanstackType,
} from "@/components/shared/datatable/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getEmployeeAvatarUrl,
  getEmployeeInitials,
} from "@/lib/employee-teacher-display"
import type { PaginatedLeaveApplicationsResponse } from "@/lib/leave-applications-api"
import {
  mapLeaveApplicationsToHrApprovalRows,
  type HrApprovalRow,
} from "@/lib/map-hr-approval-row"
import { OverallStatusBadge } from "@/routes/my-leave/-leave-status-badge"

function mapToRecordPagination(
  response: PaginatedLeaveApplicationsResponse | undefined,
  rows: HrApprovalRow[],
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

type HrApprovalDataTableProps = {
  tanstack: TanstackType
  response: PaginatedLeaveApplicationsResponse | undefined
  leaveTypeNames: Map<number, string>
  isLoading?: boolean
  isError?: boolean
  onViewDetails: (row: HrApprovalRow) => void
}

export function HrApprovalDataTable({
  tanstack,
  response,
  leaveTypeNames,
  isLoading = false,
  isError = false,
  onViewDetails,
}: HrApprovalDataTableProps) {
  const rows = React.useMemo(
    () => mapLeaveApplicationsToHrApprovalRows(response?.data ?? [], leaveTypeNames),
    [leaveTypeNames, response?.data],
  )

  const tableData = React.useMemo(
    () => mapToRecordPagination(response, rows),
    [response, rows],
  )

  if (isError) {
    return (
      <div className="text-destructive rounded-md border border-dashed px-4 py-10 text-center text-sm">
        Unable to load HR approval requests. Please try again.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <DataTableSearchBar
        tanstack={tanstack}
        mode="enter"
        data={{
          placeholder: "Search by employee name or number (press Enter)...",
        }}
        styles={{ input: "h-9 pl-8 text-sm" }}
      />

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-xl" />
            ))
          : rows.map((row) => {
              const avatarUrl = getEmployeeAvatarUrl(row.record.employee_teacher)

              return (
                <div
                  key={row.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-4 transition-colors hover:bg-slate-50 sm:px-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10 shrink-0">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt={row.employee} />
                      ) : null}
                      <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-700">
                        {getEmployeeInitials(row.record.employee_teacher)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-0">
                      <p className="text-sm font-semibold">{row.employee}</p>
                      <p className="text-muted-foreground text-xs tabular-nums">
                        {row.record.employee_no}
                      </p>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {row.department} • {row.leaveType} • {row.dates} • {row.days}{" "}
                        day{row.days === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <OverallStatusBadge status={row.status} />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onViewDetails(row)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              )
            })}

        {!isLoading && rows.length === 0 ? (
          <div className="text-muted-foreground rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm">
            No HR approval requests match the selected filters.
          </div>
        ) : null}
      </div>

      {!isLoading ? (
        <>
          <p className="text-muted-foreground text-sm">
            {tableData.total} request{tableData.total === 1 ? "" : "s"} in queue
          </p>
          <DataTableServerPagination tanstack={tanstack} data={tableData} />
        </>
      ) : null}
    </div>
  )
}
