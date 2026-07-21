import {
  buildLeaveTypesById,
  formatPrintEmployeeName,
  formatPrintHrRemarks,
  formatPrintLeaveDate,
  getPrintLeaveDetailSegments,
} from "@/lib/filed-leave-print-format"
import type { LeaveTypeRecord } from "@/lib/leave-types-api"
import type { FiledLeaveReportRow } from "@/lib/map-filed-leave-report-row"
import { LEAVE_STATUS_FILTER_OPTIONS } from "@/routes/my-leave/-leave-status"
import * as React from "react"

type FiledLeavePrintProps = {
  rows: FiledLeaveReportRow[]
  leaveTypes: LeaveTypeRecord[]
  filterSummary: {
    search: string
    dateFrom: string
    dateTo: string
    status: string
    department: string
  }
  printedAt: Date
}

function resolveStatusLabel(value: string): string {
  return (
    LEAVE_STATUS_FILTER_OPTIONS.find((option) => option.value === value)?.label ??
    value
  )
}

function resolveLeaveDateFilterLabel(dateFrom: string, dateTo: string): string | null {
  const from = dateFrom.trim()
  const to = dateTo.trim()

  if (!from && !to) {
    return null
  }

  if (from && to) {
    return `${from} - ${to}`
  }

  return from || to
}

export function FiledLeavePrint({
  rows,
  leaveTypes,
  filterSummary,
  printedAt,
}: FiledLeavePrintProps) {
  const leaveTypesById = React.useMemo(
    () => buildLeaveTypesById(leaveTypes),
    [leaveTypes],
  )

  const printedAtLabel = printedAt.toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  })

  const leaveDateFilterLabel = resolveLeaveDateFilterLabel(
    filterSummary.dateFrom,
    filterSummary.dateTo,
  )

  return (
    <section className="eleave-filed-leave-print hidden print:block" aria-hidden>
      <style>{`
        @media print {
          @page {
            margin: 0.25in;
          }
          body * {
            visibility: hidden;
          }
          .eleave-filed-leave-print,
          .eleave-filed-leave-print * {
            visibility: visible;
          }
          .eleave-filed-leave-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
          }
        }
      `}</style>

      <header className="mb-4 border-b pb-3">
        <p className="text-sm text-slate-600 mb-2">Eleave - Adamson University</p>
        <h1 className="text-lg font-semibold">Filed Leave Report</h1>
        <p className="text-sm text-slate-600">Printed at {printedAtLabel}</p>
        <dl className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-1">
          {filterSummary.search ? (
            <div>
              <dt className="inline font-medium">Search: </dt>
              <dd className="inline">{filterSummary.search}</dd>
            </div>
          ) : null}
          {leaveDateFilterLabel ? (
            <div>
              <dt className="inline font-medium">Leave date: </dt>
              <dd className="inline">{leaveDateFilterLabel}</dd>
            </div>
          ) : null}
          {filterSummary.status !== "all" ? (
            <div>
              <dt className="inline font-medium">Status: </dt>
              <dd className="inline">{resolveStatusLabel(filterSummary.status)}</dd>
            </div>
          ) : null}
          {filterSummary.department !== "all" ? (
            <div>
              <dt className="inline font-medium">Department: </dt>
              <dd className="inline">{filterSummary.department}</dd>
            </div>
          ) : null}
        </dl>
      </header>

      <table className="w-full border-collapse border border-slate-300 text-xs">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-300 px-3 py-2 text-center font-semibold text-slate-500">
              Name
            </th>
            <th className="border border-slate-300 px-3 py-2 text-center font-semibold text-slate-500">
              Details
            </th>
            <th className="border border-slate-300 px-3 py-2 text-center font-semibold text-slate-500">
              Date of Leave
            </th>
            <th className="border border-slate-300 px-3 py-2 text-center font-semibold text-slate-500">
              Reasons
            </th>
            <th className="border border-slate-300 px-3 py-2 text-center font-semibold text-slate-500">
              HR Remarks
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="align-top">
              <td className="border border-slate-300 px-3 py-3 text-center font-bold uppercase">
                {formatPrintEmployeeName(row.record.employee_teacher, row.employee)}
              </td>
              <td className="border border-slate-300 px-3 py-3 text-left">
                {getPrintLeaveDetailSegments(row, leaveTypesById).map(
                  (segment, index) => (
                    <React.Fragment key={`${row.id}-detail-${index}`}>
                      {index > 0 ? (
                        <span className="mx-1 text-slate-500">·</span>
                      ) : null}
                      <span>{segment}</span>
                    </React.Fragment>
                  ),
                )}
              </td>
              <td className="border border-slate-300 px-0 py-3 text-center">
                {formatPrintLeaveDate(row.record.date_from, row.record.date_to)}
              </td>
              <td className="border border-slate-300 px-3 py-3 text-left">
                {row.record.reason?.trim() || "—"}
              </td>
              <td className="border border-slate-300 px-3 py-3 text-left uppercase">
                {formatPrintHrRemarks(row)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-3 text-xs text-slate-600">
        {rows.length} leave application{rows.length === 1 ? "" : "s"}
      </p>
    </section>
  )
}
