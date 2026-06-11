import { createFileRoute } from "@tanstack/react-router"
import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthUser } from "@/hooks/use-auth-user"
import { useForApprovalLeaveApplications } from "@/hooks/use-for-approval-leave-applications"
import { useLeaveTypes } from "@/hooks/use-leave-types"
import { resolveEmployeeNo } from "@/lib/fetch-auth-user"
import {
  getEmployeeAvatarUrl,
  getEmployeeInitials,
} from "@/lib/employee-teacher-display"
import {
  collectLeavePeriodYears,
  matchesLeaveYearFilter,
} from "@/lib/leave-date-year"
import {
  mapLeaveApplicationsToForApprovalRows,
  type ForApprovalRow,
} from "@/lib/map-for-approval-row"
import { resolveViewerApprovalStatus } from "@/lib/resolve-viewer-approval-status"
import { ViewForApprovalSheet } from "@/routes/for-approval/-view-for-approval-sheet"
import { OverallStatusBadge } from "@/routes/my-leave/-leave-status-badge"
import { formatDateShort } from "@/routes/my-leave/leave-form/utils"

export const Route = createFileRoute("/for-approval/")({
  component: ForApprovalPage,
})

const matchesStatusFilter = (
  row: ForApprovalRow,
  selectedStatus: string,
  viewerEmpNo: string | null,
): boolean => {
  if (selectedStatus === "all") {
    return true
  }

  const viewerStatus =
    resolveViewerApprovalStatus(row.record, viewerEmpNo) ?? "pending"

  return viewerStatus === selectedStatus
}

function ForApprovalPage() {
  const { data: authUser } = useAuthUser()
  const viewerEmpNo = resolveEmployeeNo(authUser ?? {})
  const { data: leaveTypes = [] } = useLeaveTypes()
  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useForApprovalLeaveApplications()

  const leaveTypeNames = React.useMemo(
    () => new Map(leaveTypes.map((type) => [type.id, type.leave_name])),
    [leaveTypes],
  )

  const rows = React.useMemo(
    () => mapLeaveApplicationsToForApprovalRows(response?.data ?? [], leaveTypeNames),
    [leaveTypeNames, response?.data],
  )

  const years = React.useMemo(
    () =>
      collectLeavePeriodYears(
        rows.map((row) => ({
          date_from: row.record.date_from,
          date_to: row.record.date_to,
        })),
      ),
    [rows],
  )

  const [selectedYear, setSelectedYear] = React.useState<string>(
    String(new Date().getFullYear()),
  )
  const [selectedStatus, setSelectedStatus] = React.useState<string>("pending")
  const [isViewSheetOpen, setIsViewSheetOpen] = React.useState(false)
  const [activeRequest, setActiveRequest] = React.useState<ForApprovalRow | null>(
    null,
  )

  const openDetails = (row: ForApprovalRow) => {
    setActiveRequest(row)
    setIsViewSheetOpen(true)
  }

  const filteredRequests = React.useMemo(
    () =>
      rows.filter((row) => {
        const yearMatches = matchesLeaveYearFilter(
          row.record.date_from,
          row.record.date_to,
          selectedYear,
        )

        return yearMatches && matchesStatusFilter(row, selectedStatus, viewerEmpNo)
      }),
    [rows, selectedStatus, selectedYear, viewerEmpNo],
  )

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.14),_transparent_55%),linear-gradient(90deg,_#fef3c7_0%,_#fffbeb_52%,_#ffffff_100%)] p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-900 shadow-sm">
            Approval Queue
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            For Approval
          </h1>
          <p className="text-muted-foreground mt-2 max-w-3xl text-sm sm:text-base">
            Review leave applications, filter by year and status, then update
            decisions directly from the details panel.
          </p>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Filters
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="space-y-0.5">
            <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
              Filter by Year
            </span>
            <select
              value={selectedYear}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                setSelectedYear(event.target.value)
              }
              className="h-9 w-full rounded-lg border border-slate-300 bg-background px-2.5 text-sm shadow-sm transition-colors focus:border-primary"
            >
              <option value="all">All Years</option>
              {years.map((year) => (
                <option key={year} value={String(year)}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-0.5">
            <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
              Filter by Status
            </span>
            <select
              value={selectedStatus}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                setSelectedStatus(event.target.value)
              }
              className="h-9 w-full rounded-lg border border-slate-300 bg-background px-2.5 text-sm shadow-sm transition-colors focus:border-primary"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="disapproved">Disapproved</option>
              <option value="pending">Pending</option>
            </select>
          </label>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 sm:px-6">
          <h2 className="text-base font-semibold">Leave Requests</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Select a request to open details and update approval status.
          </p>
        </div>

        <div className="space-y-3 p-3 sm:p-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-xl" />
            ))
          ) : isError ? (
            <div className="space-y-3 rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center">
              <p className="text-destructive text-sm">
                Unable to load leave requests for approval.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
                Try again
              </Button>
            </div>
          ) : (
            filteredRequests.map((row) => {
              const avatarUrl = getEmployeeAvatarUrl(row.record.employee_teacher)

              return (
                <div
                  key={row.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-4 transition-colors hover:bg-slate-50 sm:px-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt={row.employeeName} />
                      ) : null}
                      <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-700">
                        {getEmployeeInitials(row.record.employee_teacher)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-0">
                      <p className="text-sm font-semibold">{row.employeeName}</p>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {row.leaveType} • {row.dates} • {row.days} day
                        {row.days === 1 ? "" : "s"}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Filed on{" "}
                        <span className="font-medium">
                          {formatDateShort(row.record.date_filed)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <OverallStatusBadge
                      status={
                        resolveViewerApprovalStatus(row.record, viewerEmpNo) ??
                        "pending"
                      }
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => openDetails(row)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              )
            })
          )}

          {!isLoading && !isError && filteredRequests.length === 0 ? (
            <div className="text-muted-foreground rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm">
              No leave requests match the selected filters.
            </div>
          ) : null}
        </div>
      </section>

      <ViewForApprovalSheet
        open={isViewSheetOpen}
        onOpenChange={setIsViewSheetOpen}
        activeRequest={activeRequest}
        onActiveRequestChange={setActiveRequest}
        leaveTypeNames={leaveTypeNames}
        viewerEmpNo={viewerEmpNo}
      />
    </>
  )
}
