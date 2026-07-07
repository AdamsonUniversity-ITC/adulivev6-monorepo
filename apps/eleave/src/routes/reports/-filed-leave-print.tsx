import type { FiledLeaveReportRow } from "@/lib/map-filed-leave-report-row"
import { LEAVE_STATUS_FILTER_OPTIONS } from "@/routes/my-leave/-leave-status"

type FiledLeavePrintProps = {
  rows: FiledLeaveReportRow[]
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
  filterSummary,
  printedAt,
}: FiledLeavePrintProps) {
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
            padding: 1rem;
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

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b">
            <th className="px-2 py-2 text-left font-semibold">Employee</th>
            <th className="px-2 py-2 text-left font-semibold">Leave</th>
            <th className="px-2 py-2 text-left font-semibold">HR remarks</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b align-top">
              <td className="px-2 py-2">
                <div>{row.employee}</div>
                <div className="text-slate-600">{row.employeeNo}</div>
                <div className="text-slate-600">{row.department}</div>
              </td>
              <td className="px-2 py-2">
              <div>{row.leaveType}</div>
                <div className="text-slate-600">
                  {row.dates} · {row.days} day{row.days === 1 ? "" : "s"}
                </div>
                <div>{row.record.reason?.trim() || "—"}</div>
                <div className="text-slate-600">{row.approvalsLabel}</div>
              </td>
              <td className="px-2 py-2">{row.hrRemarksLabel || "—"}</td>
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
