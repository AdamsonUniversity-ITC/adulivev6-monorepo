import { Button } from "@repo/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card"
import { createFileRoute } from "@tanstack/react-router"
import { FolderOpen, Printer } from "lucide-react"
import * as React from "react"

import { useDataTable } from "@/components/shared/datatable"
import {
  useFiledLeaveReport,
  useFiledLeaveReportDepartments,
} from "@/hooks/use-filed-leave-report"
import { useAdminLeaveTypes } from "@/hooks/use-admin-leave-types"
import { fetchFiledLeaveReport, isPaginatedFiledLeaveResponse } from "@/lib/filed-leave-report-api"
import {
  mapLeaveApplicationsToFiledLeaveReportRows,
  sortFiledLeaveReportRowsByEmployeeName,
  type FiledLeaveReportRow,
} from "@/lib/map-filed-leave-report-row"
import type { HrApprovalRow } from "@/lib/map-hr-approval-row"
import { ViewHrApprovalSheet } from "@/routes/hr-approval/-view-hr-approval-sheet"

import { FiledLeaveDataTable } from "./-filed-leave-datatable"
import { FiledLeavePrint } from "./-filed-leave-print"

export const Route = createFileRoute("/reports/filed-leave")({
  component: FiledLeavePage,
})

function FiledLeavePage() {
  const { data: leaveTypes = [] } = useAdminLeaveTypes()
  const tanstackHook = useDataTable()

  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [departmentFilter, setDepartmentFilter] = React.useState("all")
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [activeRequest, setActiveRequest] = React.useState<HrApprovalRow | null>(
    null,
  )
  const [printRows, setPrintRows] = React.useState<FiledLeaveReportRow[]>([])
  const [printedAt, setPrintedAt] = React.useState<Date | null>(null)
  const [isPrinting, setIsPrinting] = React.useState(false)

  const leaveTypeNames = React.useMemo(
    () => new Map(leaveTypes.map((type) => [type.id, type.leave_name])),
    [leaveTypes],
  )

  React.useEffect(() => {
    tanstackHook.setPage(1)
  }, [
    tanstackHook.keyword,
    dateFrom,
    dateTo,
    statusFilter,
    departmentFilter,
    tanstackHook.setPage,
  ])

  const departmentParams = React.useMemo(
    () => ({
      search: tanstackHook.keyword.trim() || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
    }),
    [tanstackHook.keyword, dateFrom, dateTo, statusFilter],
  )

  const { data: departments = [] } = useFiledLeaveReportDepartments(departmentParams)

  React.useEffect(() => {
    if (departmentFilter === "all") {
      return
    }

    const isValidDepartment = departments.some(
      (department) => String(department.id) === departmentFilter,
    )

    if (!isValidDepartment) {
      setDepartmentFilter("all")
    }
  }, [departmentFilter, departments])

  const listParams = React.useMemo(
    () => ({
      page: tanstackHook.page,
      per_page: tanstackHook.rows,
      search: tanstackHook.keyword.trim() || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      section_id: departmentFilter !== "all" ? departmentFilter : undefined,
    }),
    [
      tanstackHook.page,
      tanstackHook.rows,
      tanstackHook.keyword,
      dateFrom,
      dateTo,
      statusFilter,
      departmentFilter,
    ],
  )

  const { data, isPending, isError } = useFiledLeaveReport(listParams)

  const paginatedResponse = isPaginatedFiledLeaveResponse(data) ? data : undefined
  const isInitialLoading = isPending && !paginatedResponse

  const departmentLabel =
    departmentFilter === "all"
      ? "all"
      : (departments.find((item) => String(item.id) === departmentFilter)?.sec_name ??
        departmentFilter)

  const handleClearFilters = React.useCallback(() => {
    tanstackHook.setKeyword("")
    setDateFrom("")
    setDateTo("")
    setStatusFilter("all")
    setDepartmentFilter("all")
    tanstackHook.setPage(1)
  }, [tanstackHook])

  const handleRowClick = React.useCallback((row: FiledLeaveReportRow) => {
    setActiveRequest(row)
    setIsSheetOpen(true)
  }, [])

  const handlePrint = React.useCallback(async () => {
    setIsPrinting(true)

    try {
      const response = await fetchFiledLeaveReport({
        ...listParams,
        page: undefined,
        per_page: undefined,
        all: true,
      })

      const records = response.data ?? []
      const rows = sortFiledLeaveReportRowsByEmployeeName(
        mapLeaveApplicationsToFiledLeaveReportRows(records, leaveTypeNames),
      )

      setPrintRows(rows)
      setPrintedAt(new Date())
      window.requestAnimationFrame(() => window.print())
    } finally {
      setIsPrinting(false)
    }
  }, [leaveTypeNames, listParams])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.14),_transparent_55%),linear-gradient(90deg,_#fef3c7_0%,_#fffbeb_52%,_#ffffff_100%)] p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-900 shadow-sm">
            Reports
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Filed Leave
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm sm:text-base">
            Browse filed leave applications across all approval stages.
          </p>
        </div>

        <Button
          type="button"
          size="lg"
          className="shadow-sm"
          onClick={() => void handlePrint()}
          disabled={isPrinting}
        >
          <Printer className="size-4" />
          {isPrinting ? "Preparing..." : "Print report"}
        </Button>
      </div>

      <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-sm">
        <CardHeader className="border-b bg-muted/20 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
              <FolderOpen className="size-4" />
            </div>
            <div>
              <CardTitle className="text-lg">Leave applications</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-5">
          <FiledLeaveDataTable
            tanstack={{ hook: tanstackHook }}
            response={paginatedResponse}
            leaveTypeNames={leaveTypeNames}
            isLoading={isInitialLoading}
            isError={isError && !paginatedResponse}
            dateFrom={dateFrom}
            dateTo={dateTo}
            statusFilter={statusFilter}
            departmentFilter={departmentFilter}
            departments={departments}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onStatusFilterChange={setStatusFilter}
            onDepartmentFilterChange={setDepartmentFilter}
            onClearFilters={handleClearFilters}
            onRowClick={handleRowClick}
          />
        </CardContent>
      </Card>

      <ViewHrApprovalSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        activeRequest={activeRequest}
        onActiveRequestChange={setActiveRequest}
        leaveTypeNames={leaveTypeNames}
        leaveTypes={leaveTypes}
        readOnly
      />

      {printedAt ? (
        <FiledLeavePrint
          rows={printRows}
          leaveTypes={leaveTypes}
          printedAt={printedAt}
          filterSummary={{
            search: tanstackHook.keyword.trim(),
            dateFrom,
            dateTo,
            status: statusFilter,
            department: departmentLabel,
          }}
        />
      ) : null}
    </div>
  )
}
