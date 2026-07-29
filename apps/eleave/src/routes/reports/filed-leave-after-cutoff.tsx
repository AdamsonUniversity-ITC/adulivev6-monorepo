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

import { useDataTable } from "@/components/shared/datatable"
import {
  useAfterCutoffPrintStatus,
  useFiledLeaveAfterCutoffReport,
} from "@/hooks/use-filed-leave-after-cutoff-report"
import { useAdminLeaveTypes } from "@/hooks/use-admin-leave-types"
import {
  fetchFiledLeaveAfterCutoffReport,
  isPaginatedFiledLeaveAfterCutoffResponse,
  recordAfterCutoffPrint,
} from "@/lib/filed-leave-after-cutoff-report-api"
import {
  mapLeaveApplicationsToFiledLeaveReportRows,
  sortFiledLeaveReportRowsByEmployeeName,
  type FiledLeaveReportRow,
} from "@/lib/map-filed-leave-report-row"
import type { HrApprovalRow } from "@/lib/map-hr-approval-row"
import { ViewHrApprovalSheet } from "@/routes/hr-approval/-view-hr-approval-sheet"

import { FiledLeaveAfterCutoffDataTable } from "./-filed-leave-after-cutoff-datatable"
import { FiledLeaveAfterCutoffPrint } from "./-filed-leave-after-cutoff-print"

type PrintMode = "initial" | "remaining" | "all"

export const Route = createFileRoute("/reports/filed-leave-after-cutoff")({
  component: FiledLeaveAfterCutoffPage,
})

function FiledLeaveAfterCutoffPage() {
  const queryClient = useQueryClient()
  const { data: leaveTypes = [] } = useAdminLeaveTypes()
  const tanstackHook = useDataTable()

  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")
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

  const leaveTypeNames = React.useMemo(
    () => new Map(leaveTypes.map((type) => [type.id, type.leave_name])),
    [leaveTypes],
  )

  const hasDateRange = dateFrom !== "" && dateTo !== ""

  const printStatusParams = React.useMemo(
    () =>
      hasDateRange
        ? {
            date_from: dateFrom,
            date_to: dateTo,
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
      classificationFilter,
      employmentTypeFilter,
    ],
  )

  const { data: printStatus, isPending: isPrintStatusPending } =
    useAfterCutoffPrintStatus(printStatusParams)

  React.useEffect(() => {
    tanstackHook.setPage(1)
  }, [
    tanstackHook.keyword,
    dateFrom,
    dateTo,
    employmentTypeFilter,
    classificationFilter,
    tanstackHook.setPage,
  ])

  const listParams = React.useMemo(
    () => ({
      page: tanstackHook.page,
      per_page: tanstackHook.rows,
      search: tanstackHook.keyword.trim() || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      classification:
        classificationFilter !== "all" ? classificationFilter : undefined,
      employment_type:
        employmentTypeFilter !== "all" ? employmentTypeFilter : undefined,
    }),
    [
      tanstackHook.page,
      tanstackHook.rows,
      tanstackHook.keyword,
      dateFrom,
      dateTo,
      classificationFilter,
      employmentTypeFilter,
    ],
  )

  const { data, isPending, isFetching, isError } = useFiledLeaveAfterCutoffReport(listParams)

  const paginatedResponse = isPaginatedFiledLeaveAfterCutoffResponse(data)
    ? data
    : undefined
  const isListLoading = isPending || isFetching

  const printedApplicationIds = React.useMemo(
    () => new Set(printStatus?.printed_application_ids ?? []),
    [printStatus?.printed_application_ids],
  )

  const handleClearFilters = React.useCallback(() => {
    tanstackHook.setKeyword("")
    setDateFrom("")
    setDateTo("")
    setEmploymentTypeFilter("all")
    setClassificationFilter("all")
    tanstackHook.setPage(1)
  }, [tanstackHook])

  const handleRowClick = React.useCallback((row: FiledLeaveReportRow) => {
    setActiveRequest(row)
    setIsSheetOpen(true)
  }, [])

  const handlePrint = React.useCallback(
    async (mode: PrintMode) => {
      if (!hasDateRange) {
        return
      }

      setIsPrinting(true)

      try {
        const response = await fetchFiledLeaveAfterCutoffReport({
          date_from: dateFrom,
          date_to: dateTo,
          classification:
            classificationFilter !== "all" ? classificationFilter : undefined,
          employment_type:
            employmentTypeFilter !== "all" ? employmentTypeFilter : undefined,
          all: true,
          exclude_printed: mode === "remaining",
        })

        const records = response.data ?? []
        const rows = sortFiledLeaveReportRowsByEmployeeName(
          mapLeaveApplicationsToFiledLeaveReportRows(records, leaveTypeNames),
        )

        if (rows.length === 0) {
          return
        }

        setPrintSubtitle(
          mode === "remaining" ? "Remaining approved applications." : undefined,
        )
        setPrintRows(rows)
        setPrintedAt(new Date())

        await new Promise<void>((resolve) => {
          window.requestAnimationFrame(() => {
            window.print()
            resolve()
          })
        })

        await recordAfterCutoffPrint({
          date_from: dateFrom,
          date_to: dateTo,
          leave_application_ids: rows.map((row) => Number(row.id)),
        })

        await queryClient.invalidateQueries({
          queryKey: ["filed-leave-after-cutoff-print-status"],
        })
      } finally {
        setIsPrinting(false)
      }
    },
    [dateFrom, dateTo, hasDateRange, leaveTypeNames, queryClient, classificationFilter, employmentTypeFilter],
  )

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
    hasDateRange &&
    !isPrintStatusPending &&
    printStatus?.has_print_history !== true

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.14),_transparent_55%),linear-gradient(90deg,_#fef3c7_0%,_#fffbeb_52%,_#ffffff_100%)] p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-900 shadow-sm">
            Reports
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Approved Listing After the Cut-off Period
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm sm:text-base">
            Browse approved leave applications after the cut-off period.
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <div className="flex flex-wrap gap-2">
            {showInitialPrint ? (
              <Button
                type="button"
                size="lg"
                className="shadow-sm"
                onClick={() => void handlePrint("initial")}
                disabled={isPrinting || !hasDateRange}
              >
                <Printer className="size-4" />
                {isPrinting ? "Preparing..." : "Print report"}
              </Button>
            ) : null}

            {showPrintRemaining ? (
              <Button
                type="button"
                size="lg"
                className="shadow-sm"
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
                className="shadow-sm"
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

          {!hasDateRange ? (
            <p className="text-muted-foreground text-xs sm:text-right">
              Set leave date from and to to enable printing.
            </p>
          ) : null}
        </div>
      </div>

      <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-sm">
        <CardHeader className="border-b bg-muted/20 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
              <FolderOpen className="size-4" />
            </div>
            <div>
              <CardTitle className="text-lg">Approved leave applications</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-5">
          <FiledLeaveAfterCutoffDataTable
            tanstack={{ hook: tanstackHook }}
            response={paginatedResponse}
            leaveTypeNames={leaveTypeNames}
            isLoading={isListLoading}
            isError={isError && !paginatedResponse}
            dateFrom={dateFrom}
            dateTo={dateTo}
            employmentTypeFilter={employmentTypeFilter}
            classificationFilter={classificationFilter}
            hasPrintHistory={printStatus?.has_print_history === true}
            printedApplicationIds={printedApplicationIds}
            remainingCount={printStatus?.remaining_count ?? 0}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
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
        <FiledLeaveAfterCutoffPrint
          rows={printRows}
          leaveTypes={leaveTypes}
          printedAt={printedAt}
          subtitle={printSubtitle}
          filterSummary={{
            search: "",
            dateFrom,
            dateTo,
            employmentType: employmentTypeFilter,
            classification: classificationFilter,
          }}
        />
      ) : null}
    </div>
  )
}
