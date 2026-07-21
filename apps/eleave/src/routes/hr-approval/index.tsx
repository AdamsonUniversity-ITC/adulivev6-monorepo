import { createFileRoute } from "@tanstack/react-router"
import * as React from "react"

import { useDataTable } from "@/components/shared/datatable"
import { useAuthUser } from "@/hooks/use-auth-user"
import { useHrApprovalLeaveApplications } from "@/hooks/use-hr-approval-leave-applications"
import { useLeaveTypes } from "@/hooks/use-leave-types"
import { collectLeavePeriodYears } from "@/lib/leave-date-year"
import type { HrApprovalRow } from "@/lib/map-hr-approval-row"
import { HrApprovalDataTable } from "@/routes/hr-approval/-hr-approval-datatable"
import { ViewHrApprovalSheet } from "@/routes/hr-approval/-view-hr-approval-sheet"
import { LEAVE_STATUS_FILTER_OPTIONS } from "@/routes/my-leave/-leave-status"

export const Route = createFileRoute("/hr-approval/")({
  component: HrApprovalPage,
})

function HrApprovalPage() {
  const { data: authUser } = useAuthUser()
  const { data: leaveTypes = [] } = useLeaveTypes()
  const tanstackHook = useDataTable()

  const permissions = authUser?.permissions ?? []
  const canViewDev = permissions.includes("eleave-dev-access")
  const canViewAdmin =
    permissions.includes("eleave-admin-approval-access") || canViewDev
  const canViewRankAndFile =
    permissions.includes("eleave-rank-and-file-approval-access") || canViewDev

  const classificationOptions = React.useMemo(() => {
    const options: { value: string; label: string }[] = []

    if (canViewAdmin) {
      options.push({ value: "admin", label: "Admin" })
    }

    if (canViewRankAndFile) {
      options.push({ value: "rank_and_file", label: "Rank and File" })
    }

    return options
  }, [canViewAdmin, canViewRankAndFile])

  const [selectedYear, setSelectedYear] = React.useState<string>(
    String(new Date().getFullYear()),
  )
  const [selectedStatus, setSelectedStatus] = React.useState<string>("pending")
  const [selectedClassification, setSelectedClassification] =
    React.useState<string>("")
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false)
  const [activeRequest, setActiveRequest] = React.useState<HrApprovalRow | null>(
    null,
  )

  React.useEffect(() => {
    if (
      classificationOptions.length > 0 &&
      !classificationOptions.some(
        (option) => option.value === selectedClassification,
      )
    ) {
      setSelectedClassification(classificationOptions[0]!.value)
    }
  }, [classificationOptions, selectedClassification])

  React.useEffect(() => {
    tanstackHook.setPage(1)
  }, [
    tanstackHook.keyword,
    selectedYear,
    selectedStatus,
    selectedClassification,
    tanstackHook.setPage,
  ])

  const listParams = React.useMemo(
    () => ({
      page: tanstackHook.page,
      per_page: tanstackHook.rows,
      search: tanstackHook.keyword.trim() || undefined,
      year: selectedYear === "all" ? undefined : selectedYear,
      status: selectedStatus === "all" ? undefined : selectedStatus,
      classification: selectedClassification || undefined,
    }),
    [
      tanstackHook.page,
      tanstackHook.rows,
      tanstackHook.keyword,
      selectedYear,
      selectedStatus,
      selectedClassification,
    ],
  )

  const {
    data: response,
    isPending,
    isFetching,
    isError,
  } = useHrApprovalLeaveApplications(listParams)

  const isListLoading = isPending || isFetching

  const leaveTypeNames = React.useMemo(
    () => new Map(leaveTypes.map((type) => [type.id, type.leave_name])),
    [leaveTypes],
  )

  const years = React.useMemo(() => {
    const fromData = collectLeavePeriodYears(
      (response?.data ?? []).map((record) => ({
        date_from: record.date_from,
        date_to: record.date_to,
      })),
    )
    const selected = Number(selectedYear)

    if (Number.isFinite(selected) && selectedYear !== "all" && !fromData.includes(selected)) {
      return [selected, ...fromData].sort((a, b) => b - a)
    }

    if (fromData.length > 0) {
      return fromData
    }

    return [new Date().getFullYear()]
  }, [response?.data, selectedYear])

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

        <div className="grid gap-2 sm:grid-cols-3">
          {classificationOptions.length > 0 ? (
            <label className="space-y-0.5">
              <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
                Filter by Type
              </span>
              <select
                value={selectedClassification}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                  setSelectedClassification(event.target.value)
                }
                className="h-9 w-full rounded-lg border border-slate-300 bg-background px-2.5 text-sm shadow-sm transition-colors focus:border-primary"
              >
                {classificationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

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
          <HrApprovalDataTable
            tanstack={{ hook: tanstackHook }}
            response={response}
            leaveTypeNames={leaveTypeNames}
            isLoading={isListLoading}
            isError={isError && !response}
            onViewDetails={openDetails}
          />
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
