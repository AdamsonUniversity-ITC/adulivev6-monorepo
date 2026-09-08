import { Button } from "@repo/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card"
import { useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { FolderOpen, Printer } from "lucide-react"
import * as React from "react"
import ReactDOM from "react-dom"

import { useDataTable } from "@/components/shared/datatable"
import {
  useFiledLeavePrintStatus,
  useFiledLeaveReport,
  useFiledLeaveReportDepartments,
} from "@/hooks/use-filed-leave-report"
import { useAdminLeaveTypes } from "@/hooks/use-admin-leave-types"
import {
  fetchFiledLeaveReport,
  isPaginatedFiledLeaveResponse,
  recordFiledLeavePrint,
  type FiledLeavePrintBatch,
} from "@/lib/filed-leave-report-api"
import {
  mapLeaveApplicationsToFiledLeaveReportRows,
  sortFiledLeaveReportRowsByEmployeeName,
  type FiledLeaveReportRow,
} from "@/lib/map-filed-leave-report-row"
import type { HrApprovalRow } from "@/lib/map-hr-approval-row"
import { ViewHrApprovalSheet } from "@/routes/hr-approval/-view-hr-approval-sheet"

import type { EmployeeSearchRecord } from "@/lib/employees-api"

import { FiledLeaveDataTable } from "./-filed-leave-datatable"
import { formatReportEmployeeLabel } from "./-employee-report-search"
import { FiledLeavePrint } from "./-filed-leave-print"

type PrintMode = "initial" | "remaining" | "all" | "batch" | "untracked"

function formatBatchPrintedAtLabel(printedAt: string): string {
  const parsed = new Date(printedAt)

  if (Number.isNaN(parsed.getTime())) {
    return printedAt
  }

  return parsed.toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export const Route = createFileRoute("/reports/filed-leave")({
  component: FiledLeavePage,
})

function FiledLeavePage() {
  const queryClient = useQueryClient()
  const { data: leaveTypes = [] } = useAdminLeaveTypes()
  const tanstackHook = useDataTable()

  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [departmentFilter, setDepartmentFilter] = React.useState("all")
  const [employmentTypeFilter, setEmploymentTypeFilter] = React.useState("all")
  const [classificationFilter, setClassificationFilter] = React.useState("all")
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [activeRequest, setActiveRequest] = React.useState<HrApprovalRow | null>(
    null,
  )
  const [printRows, setPrintRows] = React.useState<FiledLeaveReportRow[]>([])
  const [printedAt, setPrintedAt] = React.useState<Date | null>(null)
  const [printSubtitle, setPrintSubtitle] = React.useState<string | undefined>(
    undefined,
  )
  const [isPrinting, setIsPrinting] = React.useState(false)
  const [selectedEmployee, setSelectedEmployee] =
    React.useState<EmployeeSearchRecord | null>(null)

  const leaveTypeNames = React.useMemo(
    () => new Map(leaveTypes.map((type) => [type.id, type.leave_name])),
    [leaveTypes],
  )

  const selectedEmployeeNo = selectedEmployee?.emp_no?.trim() || ""
  const hasReportFilters =
    dateFrom !== "" ||
    dateTo !== "" ||
    statusFilter !== "all" ||
    departmentFilter !== "all" ||
    employmentTypeFilter !== "all" ||
    classificationFilter !== "all"
  const canLoadLeave = selectedEmployeeNo !== "" || hasReportFilters
  const hasDateRange = dateFrom !== "" && dateTo !== ""

  React.useEffect(() => {
    tanstackHook.setPage(1)
  }, [
    selectedEmployeeNo,
    dateFrom,
    dateTo,
    statusFilter,
    departmentFilter,
    employmentTypeFilter,
    classificationFilter,
    tanstackHook.setPage,
  ])

  const departmentParams = React.useMemo(
    () => ({
      search: selectedEmployeeNo || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      classification:
        classificationFilter !== "all" ? classificationFilter : undefined,
      employment_type:
        employmentTypeFilter !== "all" ? employmentTypeFilter : undefined,
    }),
    [
      selectedEmployeeNo,
      dateFrom,
      dateTo,
      statusFilter,
      classificationFilter,
      employmentTypeFilter,
    ],
  )

  const { data: departments = [] } = useFiledLeaveReportDepartments(departmentParams)

  const printStatusParams = React.useMemo(
    () =>
      hasDateRange
        ? {
            date_from: dateFrom,
            date_to: dateTo,
            search: selectedEmployeeNo || undefined,
            status: statusFilter !== "all" ? statusFilter : undefined,
            section_id: departmentFilter !== "all" ? departmentFilter : undefined,
            classification:
              classificationFilter !== "all" ? classificationFilter : undefined,
            employment_type:
              employmentTypeFilter !== "all" ? employmentTypeFilter : undefined,
          }
        : null,
    [
      dateFrom,
      dateTo,
      hasDateRange,
      selectedEmployeeNo,
      statusFilter,
      departmentFilter,
      classificationFilter,
      employmentTypeFilter,
    ],
  )

  const { data: printStatus, isPending: isPrintStatusPending } =
    useFiledLeavePrintStatus(printStatusParams)

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
      search: selectedEmployeeNo || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      section_id: departmentFilter !== "all" ? departmentFilter : undefined,
      classification:
        classificationFilter !== "all" ? classificationFilter : undefined,
      employment_type:
        employmentTypeFilter !== "all" ? employmentTypeFilter : undefined,
    }),
    [
      tanstackHook.page,
      tanstackHook.rows,
      selectedEmployeeNo,
      dateFrom,
      dateTo,
      statusFilter,
      departmentFilter,
      classificationFilter,
      employmentTypeFilter,
    ],
  )

  const { data, isPending, isFetching, isError } = useFiledLeaveReport(listParams, {
    enabled: canLoadLeave,
  })

  const paginatedResponse = isPaginatedFiledLeaveResponse(data) ? data : undefined
  const isListLoading = canLoadLeave && (isPending || isFetching)

  const printedApplicationIds = React.useMemo(
    () => new Set(printStatus?.printed_application_ids ?? []),
    [printStatus?.printed_application_ids],
  )

  const departmentLabel =
    departmentFilter === "all"
      ? "all"
      : (departments.find((item) => String(item.id) === departmentFilter)?.sec_name ??
        departmentFilter)

  const handleClearFilters = React.useCallback(() => {
    setSelectedEmployee(null)
    tanstackHook.setKeyword("")
    setDateFrom("")
    setDateTo("")
    setStatusFilter("all")
    setDepartmentFilter("all")
    setEmploymentTypeFilter("all")
    setClassificationFilter("all")
    tanstackHook.setPage(1)
  }, [tanstackHook])

  const handleRowClick = React.useCallback((row: FiledLeaveReportRow) => {
    setActiveRequest(row)
    setIsSheetOpen(true)
  }, [])

  const handlePrint = React.useCallback(
    async (mode: PrintMode, batch?: FiledLeavePrintBatch) => {
      if (!canLoadLeave) {
        return
      }

      if (hasDateRange && mode === "untracked") {
        return
      }

      setIsPrinting(true)

      try {
        const response = await fetchFiledLeaveReport({
          ...listParams,
          page: undefined,
          per_page: undefined,
          all: true,
          exclude_printed: mode === "remaining",
          leave_application_ids:
            mode === "batch" ? batch?.leave_application_ids : undefined,
        })

        const records = response.data ?? []
        const rows = sortFiledLeaveReportRowsByEmployeeName(
          mapLeaveApplicationsToFiledLeaveReportRows(records, leaveTypeNames),
        )

        if (rows.length === 0) {
          return
        }

        const batchPrintedAt =
          mode === "batch" && batch?.printed_at
            ? new Date(batch.printed_at)
            : new Date()
        const shouldRecordPrint =
          hasDateRange && (mode === "initial" || mode === "remaining")

        ReactDOM.flushSync(() => {
          setPrintSubtitle(
            mode === "remaining"
              ? "Remaining applications."
              : mode === "batch"
                ? `Reprint of ${rows.length} application(s) printed on ${formatBatchPrintedAtLabel(batch?.printed_at ?? "")}.`
                : mode === "all"
                  ? "All applications in this range."
                  : undefined,
          )
          setPrintRows(rows)
          setPrintedAt(
            Number.isNaN(batchPrintedAt.getTime()) ? new Date() : batchPrintedAt,
          )
        })

        window.print()

        if (shouldRecordPrint) {
          await recordFiledLeavePrint({
            date_from: dateFrom,
            date_to: dateTo,
            leave_application_ids: rows.map((row) => Number(row.id)),
          })

          await queryClient.invalidateQueries({
            queryKey: ["filed-leave-print-status"],
          })
        }
      } finally {
        setIsPrinting(false)
      }
    },
    [
      canLoadLeave,
      dateFrom,
      dateTo,
      hasDateRange,
      leaveTypeNames,
      listParams,
      queryClient,
    ],
  )

  const printBatches = printStatus?.batches ?? []

  const showPrintRemaining =
    hasDateRange &&
    !isPrintStatusPending &&
    printStatus?.has_print_history === true &&
    (printStatus?.remaining_count ?? 0) > 0

  const showPrintAll =
    hasDateRange &&
    !isPrintStatusPending &&
    printStatus?.has_print_history === true

  const showInitialPrint =
    !hasDateRange ||
    (!isPrintStatusPending && printStatus?.has_print_history !== true)

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.14),_transparent_55%),linear-gradient(90deg,_#fef3c7_0%,_#fffbeb_52%,_#ffffff_100%)] p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-900 shadow-sm">
            Reports
          </p>
          <h1 className="mt-3 text-xl font-semibold tracking-tight sm:text-3xl">
            Filed Leave
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm sm:text-base">
            Browse filed leave applications across all approval stages.
          </p>
        </div>

        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {showInitialPrint ? (
              <Button
                type="button"
                size="lg"
                className="w-full shadow-sm sm:w-auto"
                onClick={() =>
                  void handlePrint(hasDateRange ? "initial" : "untracked")
                }
                disabled={isPrinting || !canLoadLeave}
              >
                <Printer className="size-4" />
                {isPrinting ? "Preparing..." : "Print report"}
              </Button>
            ) : null}

            {printBatches.map((batch, index) => (
              <Button
                key={`${batch.printed_at}-${batch.printed_by}-${index}`}
                type="button"
                size="lg"
                variant="outline"
                className="w-full shadow-sm sm:w-auto"
                onClick={() => void handlePrint("batch", batch)}
                disabled={isPrinting || !hasDateRange}
              >
                <Printer className="size-4" />
                <span className="flex flex-col items-start text-left leading-tight">
                  <span>
                    {isPrinting ? "Preparing..." : `Print ${batch.count}`}
                  </span>
                  <span className="text-muted-foreground text-[11px] font-normal">
                    {formatBatchPrintedAtLabel(batch.printed_at)}
                  </span>
                </span>
              </Button>
            ))}

            {showPrintRemaining ? (
              <Button
                type="button"
                size="lg"
                className="w-full shadow-sm sm:w-auto"
                onClick={() => void handlePrint("remaining")}
                disabled={isPrinting || !hasDateRange}
              >
                <Printer className="size-4" />
                {isPrinting
                  ? "Preparing..."
                  : `Print remaining (${printStatus?.remaining_count ?? 0})`}
              </Button>
            ) : null}

            {showPrintAll ? (
              <Button
                type="button"
                size="lg"
                variant={showPrintRemaining ? "outline" : "default"}
                className="w-full shadow-sm sm:w-auto"
                onClick={() => void handlePrint("all")}
                disabled={isPrinting || !hasDateRange}
              >
                <Printer className="size-4" />
                {isPrinting ? "Preparing..." : "Print all"}
              </Button>
            ) : null}
          </div>

          {hasDateRange && printStatus ? (
            <p className="text-muted-foreground text-xs sm:text-right">
              {printStatus.printed_count} of {printStatus.total_in_range} printed
              for this range.
            </p>
          ) : null}
        </div>
      </div>

      <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-sm">
        <CardHeader className="border-b bg-muted/20 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
              <FolderOpen className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">
                Leave applications
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="min-w-0 px-4 py-4 sm:px-6 sm:py-5">
          <FiledLeaveDataTable
            tanstack={{ hook: tanstackHook }}
            response={paginatedResponse}
            leaveTypeNames={leaveTypeNames}
            isLoading={isListLoading}
            isError={isError && !paginatedResponse}
            dateFrom={dateFrom}
            dateTo={dateTo}
            statusFilter={statusFilter}
            departmentFilter={departmentFilter}
            employmentTypeFilter={employmentTypeFilter}
            classificationFilter={classificationFilter}
            departments={departments}
            canLoadLeave={canLoadLeave}
            hasPrintHistory={printStatus?.has_print_history === true}
            printedApplicationIds={printedApplicationIds}
            remainingCount={printStatus?.remaining_count ?? 0}
            selectedEmployee={selectedEmployee}
            onEmployeeChange={(employee) => {
              setSelectedEmployee(employee)
              tanstackHook.setPage(1)
            }}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onStatusFilterChange={setStatusFilter}
            onDepartmentFilterChange={setDepartmentFilter}
            onEmploymentTypeFilterChange={setEmploymentTypeFilter}
            onClassificationFilterChange={setClassificationFilter}
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
          subtitle={printSubtitle}
          filterSummary={{
            employee: selectedEmployee
              ? formatReportEmployeeLabel(selectedEmployee)
              : "",
            dateFrom,
            dateTo,
            status: statusFilter,
            department: departmentLabel,
            employmentType: employmentTypeFilter,
            classification: classificationFilter,
          }}
        />
      ) : null}
    </div>
  )
}
