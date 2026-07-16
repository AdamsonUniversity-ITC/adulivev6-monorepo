import {
  buildLeaveTypesById,
  formatPrintEmployeeName,
  getPrintLeaveDetailSegments,
} from "@/lib/filed-leave-print-format"
import {
  formatAfterCutoffDateRangeLabel,
  formatAfterCutoffHrRemarks,
  formatPrintApprovalDate,
} from "@/lib/filed-leave-after-cutoff-print-format"
import type { LeaveTypeRecord } from "@/lib/leave-types-api"
import type { FiledLeaveReportRow } from "@/lib/map-filed-leave-report-row"
import { formatDateShort } from "@/routes/my-leave/leave-form/utils"
import * as React from "react"

type FiledLeaveAfterCutoffPrintProps = {
  rows: FiledLeaveReportRow[]
  leaveTypes: LeaveTypeRecord[]
  filterSummary: {
    search: string
    dateFrom: string
    dateTo: string
  }
  printedAt: Date
  subtitle?: string
}

function AfterCutoffPrintLeaveDate({
  dateFrom,
  dateTo,
}: {
  dateFrom: string
  dateTo: string
}) {
  const from = formatDateShort(dateFrom)
  const to = formatDateShort(dateTo)

  if (!to || from === to) {
    return <span>{from}</span>
  }

  return (
    <span className="inline-block leading-snug">
      <span className="block">{from}</span>
      <span className="block text-[10px] text-slate-500">to</span>
      <span className="block">{to}</span>
    </span>
  )
}

export function FiledLeaveAfterCutoffPrint({
  rows,
  leaveTypes,
  filterSummary,
  printedAt,
  subtitle,
}: FiledLeaveAfterCutoffPrintProps) {
  const leaveTypesById = React.useMemo(
    () => buildLeaveTypesById(leaveTypes),
    [leaveTypes],
  )

  const printedAtLabel = printedAt.toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  })

  const dateRangeLabel = formatAfterCutoffDateRangeLabel(
    filterSummary.dateFrom,
    filterSummary.dateTo,
  )

  return (
    <section
      className="eleave-filed-leave-after-cutoff-print hidden print:block"
      aria-hidden
    >
      <style>{`
        @media print {
          @page {
            margin: 0.25in;
          }
          body * {
            visibility: hidden;
          }
          .eleave-filed-leave-after-cutoff-print,
          .eleave-filed-leave-after-cutoff-print * {
            visibility: visible;
          }
          .eleave-filed-leave-after-cutoff-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
          }
        }
      `}</style>

      <header className="mb-4 border-b pb-3">
        <p className="mb-2 text-sm text-slate-600">Eleave - Adamson University</p>
        <h1 className="text-lg font-semibold">
          Approved Listing After the Cut-off Period
        </h1>
        {subtitle ? (
          <p className="text-sm text-slate-600">{subtitle}</p>
        ) : null}
        <p className="text-sm text-slate-600">Printed at {printedAtLabel}</p>
        <dl className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-1">
          {dateRangeLabel ? (
            <div>
              <dt className="inline font-medium">Date Range: </dt>
              <dd className="inline">{dateRangeLabel}</dd>
            </div>
          ) : null}
          {filterSummary.search ? (
            <div>
              <dt className="inline font-medium">Search: </dt>
              <dd className="inline">{filterSummary.search}</dd>
            </div>
          ) : null}
        </dl>
      </header>

      <table className="w-full table-fixed border-collapse border border-slate-300 text-xs">
        <colgroup>
          <col className="w-[14%]" />
          <col className="w-[11%]" />
          <col className="w-[20%]" />
          <col className="w-[18%]" />
          <col className="w-[19%]" />
          <col className="w-[18%]" />
        </colgroup>
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-300 px-3 py-2 text-center font-semibold text-slate-500">
              Name
            </th>
            <th className="border border-slate-300 px-3 py-2 text-center font-semibold whitespace-nowrap text-slate-500">
              Date of Approval
            </th>
            <th className="border border-slate-300 px-3 py-2 text-center font-semibold text-slate-500">
              Details
            </th>
            <th className="border border-slate-300 px-3 py-2 text-center font-semibold whitespace-nowrap text-slate-500">
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
              <td className="border border-slate-300 px-3 py-3 text-center whitespace-nowrap">
                {formatPrintApprovalDate(row)}
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
              <td className="max-w-0 break-words border border-slate-300 px-2 py-3 text-center">
                <AfterCutoffPrintLeaveDate
                  dateFrom={row.record.date_from}
                  dateTo={row.record.date_to}
                />
              </td>
              <td className="max-w-0 break-words border border-slate-300 px-3 py-3 text-left">
                {row.record.reason?.trim() || "—"}
              </td>
              <td className="border border-slate-300 px-3 py-3 text-left">
                {formatAfterCutoffHrRemarks(row)}
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
