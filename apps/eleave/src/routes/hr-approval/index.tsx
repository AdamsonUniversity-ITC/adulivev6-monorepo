import { createFileRoute } from "@tanstack/react-router"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { useHrApprovalLeaveApplications } from "@/hooks/use-hr-approval-leave-applications"
import { useLeaveTypes } from "@/hooks/use-leave-types"
import {
  collectLeavePeriodYears,
  matchesLeaveYearFilter,
} from "@/lib/leave-date-year"
import {
  mapLeaveApplicationsToHrApprovalRows,
  type HrApprovalRow,
} from "@/lib/map-hr-approval-row"
import { HrApprovalDataTable } from "@/routes/hr-approval/-hr-approval-datatable"
import { LEAVE_STATUS_FILTER_OPTIONS } from "@/routes/my-leave/-leave-status"
import { ViewHrApprovalSheet } from "@/routes/hr-approval/-view-hr-approval-sheet"

export const Route = createFileRoute("/hr-approval/")({
  component: HrApprovalPage,
})

function HrApprovalPage() {
  const { data: leaveTypes = [] } = useLeaveTypes()
  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useHrApprovalLeaveApplications()

  const leaveTypeNames = React.useMemo(
    () => new Map(leaveTypes.map((type) => [type.id, type.leave_name])),
    [leaveTypes],
  )

  const rows = React.useMemo(
    () =>
      mapLeaveApplicationsToHrApprovalRows(response?.data ?? [], leaveTypeNames),
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

  const [selectedYear, setSelectedYear] = React.useState<string>("all")
  const [selectedStatus, setSelectedStatus] = React.useState<string>("partially_approved")
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false)
  const [activeRequest, setActiveRequest] = React.useState<HrApprovalRow | null>(
    null,
  )

  const filteredRequests = React.useMemo(
    () =>
      rows.filter((row) => {
        const yearMatches = matchesLeaveYearFilter(
          row.record.date_from,
          row.record.date_to,
          selectedYear,
        )
        const statusMatches =
          selectedStatus === "all" || row.status === selectedStatus

        return yearMatches && statusMatches
      }),
    [rows, selectedStatus, selectedYear],
  )

  function openDetails(row: HrApprovalRow) {
    setActiveRequest(row)
    setIsViewModalOpen(true)
  }

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.14),_transparent_55%),linear-gradient(90deg,_#fef3c7_0%,_#fffbeb_52%,_#ffffff_100%)] p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-900 shadow-sm">
            HR Queue
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            HR Approval
          </h1>
          <p className="text-muted-foreground mt-2 max-w-4xl text-sm sm:text-base">
            Review requests endorsed by approvers, validate HR compliance, and
            finalize decision updates from the details panel.
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
              {LEAVE_STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 sm:px-6">
          <h2 className="text-base font-semibold">HR Review Requests</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Open request details and apply HR approval decisions.
          </p>
        </div>

        <div className="p-3 sm:p-4">
          {isError ? (
            <div className="space-y-3 rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center">
              <p className="text-destructive text-sm">
                Unable to load HR approval requests.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
                Try again
              </Button>
            </div>
          ) : (
            <HrApprovalDataTable
              rows={filteredRequests}
              isLoading={isLoading}
              onViewDetails={openDetails}
              selectedYear={selectedYear}
              selectedStatus={selectedStatus}
            />
          )}
        </div>
      </section>

      <ViewHrApprovalSheet
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        activeRequest={activeRequest}
        onActiveRequestChange={setActiveRequest}
        leaveTypeNames={leaveTypeNames}
        leaveTypes={leaveTypes}
      />
    </>
  )
}
