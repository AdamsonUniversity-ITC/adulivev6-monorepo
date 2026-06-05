import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../components/ui/sheet.js";

type HrApprovalStatus =
  | "pending"
  | "approved_with_pay"
  | "approved_without_pay"
  | "disapproved"
  | "cancelled";

type HrApprovalDayDecision = {
  dayNumber: number;
  actualDate: string;
  leaveType: string;
  status: HrApprovalStatus;
  hrRemarks: string;
};

type HrApprovalRequest = {
  id: string;
  employee: string;
  department: string;
  leaveType: string;
  dates: string;
  days: number;
  year: number;
  status: HrApprovalStatus;
  dailyDecisions: HrApprovalDayDecision[];
};

const LEAVE_TYPE_OPTIONS = [
  "Vacation Leave",
  "Sick Leave",
  "Emergency Leave",
  "Special Purpose Leave",
  "Maternity Leave",
  "Paternity Leave",
  "Bereavement Leave",
  "Leave Without Pay",
];

const MONTH_INDEX: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

function formatDisplayDate(day: number, month: string, year: number): string {
  return new Date(year, MONTH_INDEX[month] ?? 0, day).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
}

function expandActualDates(dateSpan: string, days: number): string[] {
  const trimmed = dateSpan.trim();
  const rangeMatch = trimmed.match(
    /^([A-Za-z]{3})\s+(\d{1,2})-(\d{1,2}),\s*(\d{4})$/,
  );
  if (rangeMatch) {
    const month = rangeMatch[1] as keyof typeof MONTH_INDEX;
    const startDay = Number(rangeMatch[2]);
    const endDay = Number(rangeMatch[3]);
    const year = Number(rangeMatch[4]);
    return Array.from(
      { length: Math.max(0, endDay - startDay + 1) },
      (_, index) => formatDisplayDate(startDay + index, month, year),
    );
  }

  const singleMatch = trimmed.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/);
  if (singleMatch) {
    const month = singleMatch[1] as keyof typeof MONTH_INDEX;
    const day = Number(singleMatch[2]);
    const year = Number(singleMatch[3]);
    return [formatDisplayDate(day, month, year)];
  }

  return Array.from({ length: days }, (_, index) => `Day ${index + 1}`);
}

function createDailyDecisions(
  dateSpan: string,
  days: number,
  leaveType: string,
  status: HrApprovalStatus,
): HrApprovalDayDecision[] {
  const actualDates = expandActualDates(dateSpan, days);

  return Array.from({ length: days }, (_, index) => ({
    dayNumber: index + 1,
    actualDate: actualDates[index] ?? `Day ${index + 1}`,
    leaveType,
    status,
    hrRemarks: "",
  }));
}

function summarizeStatus(decisions: HrApprovalDayDecision[]): HrApprovalStatus {
  const statuses = decisions.map((entry) => entry.status);

  if (statuses.every((status) => status === "approved_with_pay")) {
    return "approved_with_pay";
  }

  if (statuses.every((status) => status === "approved_without_pay")) {
    return "approved_without_pay";
  }

  if (statuses.every((status) => status === "disapproved")) {
    return "disapproved";
  }

  if (statuses.every((status) => status === "cancelled")) {
    return "cancelled";
  }

  return "pending";
}

function summarizeLeaveType(decisions: HrApprovalDayDecision[]): string {
  const first = decisions[0]?.leaveType;
  if (!first) return "-";

  return decisions.every((entry) => entry.leaveType === first)
    ? first
    : "Multiple Leave Types";
}

const INITIAL_HR_REQUESTS: HrApprovalRequest[] = [
  {
    id: "HR-2102",
    employee: "Mica Santos",
    department: "Finance",
    leaveType: "Sick Leave",
    dates: "Jun 7, 2026",
    days: 1,
    year: 2026,
    status: "approved_with_pay",
    dailyDecisions: createDailyDecisions(
      "Jun 7, 2026",
      1,
      "Sick Leave",
      "approved_with_pay",
    ),
  },
  {
    id: "HR-2104",
    employee: "Kaye Lim",
    department: "Operations",
    leaveType: "Emergency Leave",
    dates: "Jun 6-8, 2026",
    days: 3,
    year: 2026,
    status: "disapproved",
    dailyDecisions: createDailyDecisions(
      "Jun 6-8, 2026",
      3,
      "Emergency Leave",
      "disapproved",
    ),
  },
  {
    id: "HR-2107",
    employee: "Ramon Dela Cruz",
    department: "Engineering",
    leaveType: "Vacation Leave",
    dates: "Jun 10-12, 2026",
    days: 3,
    year: 2026,
    status: "pending",
    dailyDecisions: createDailyDecisions(
      "Jun 10-12, 2026",
      3,
      "Vacation Leave",
      "pending",
    ),
  },
  {
    id: "HR-2093",
    employee: "Iris Mendoza",
    department: "Marketing",
    leaveType: "Special Purpose Leave",
    dates: "Dec 12-13, 2025",
    days: 2,
    year: 2025,
    status: "approved_without_pay",
    dailyDecisions: createDailyDecisions(
      "Dec 12-13, 2025",
      2,
      "Special Purpose Leave",
      "approved_without_pay",
    ),
  },
  {
    id: "HR-2088",
    employee: "Jules Aquino",
    department: "Accounting",
    leaveType: "Sick Leave",
    dates: "Nov 21, 2025",
    days: 1,
    year: 2025,
    status: "pending",
    dailyDecisions: createDailyDecisions(
      "Nov 21, 2025",
      1,
      "Sick Leave",
      "pending",
    ),
  },
];

export const Route = createFileRoute("/hr-approval/")({
  component: HrApprovalPage,
});

function HrApprovalPage() {
  const [requests, setRequests] =
    React.useState<HrApprovalRequest[]>(INITIAL_HR_REQUESTS);
  const years = Array.from(new Set(requests.map((row) => row.year))).sort(
    (a, b) => b - a,
  );
  const [selectedYear, setSelectedYear] = React.useState<string>("all");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("pending");
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
  const [isApplyConfirmOpen, setIsApplyConfirmOpen] = React.useState(false);
  const [activeRequest, setActiveRequest] =
    React.useState<HrApprovalRequest | null>(null);
  const [dailyDraft, setDailyDraft] = React.useState<HrApprovalDayDecision[]>(
    [],
  );

  const filteredRequests = React.useMemo(
    () =>
      requests.filter((row) => {
        const yearMatches =
          selectedYear === "all" || String(row.year) === selectedYear;
        const statusMatches =
          selectedStatus === "all" || row.status === selectedStatus;

        return yearMatches && statusMatches;
      }),
    [requests, selectedStatus, selectedYear],
  );

  function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return (parts[0] ?? "").slice(0, 2).toUpperCase();

    const first = parts[0]?.[0] ?? "";
    const second = parts[1]?.[0] ?? "";
    return `${first}${second}`.toUpperCase();
  }

  function openDetails(row: HrApprovalRequest) {
    setActiveRequest(row);
    setDailyDraft(row.dailyDecisions.map((entry) => ({ ...entry })));
    setIsViewModalOpen(true);
    setIsApplyConfirmOpen(false);
  }

  function updateDraftDecision<K extends "leaveType" | "status" | "hrRemarks">(
    dayNumber: number,
    field: K,
    value: HrApprovalDayDecision[K],
  ) {
    setDailyDraft((current) =>
      current.map((entry) =>
        entry.dayNumber === dayNumber
          ? {
              ...entry,
              [field]: value,
            }
          : entry,
      ),
    );
  }

  function applyDailyChanges() {
    if (!activeRequest) return;

    const nextStatus = summarizeStatus(dailyDraft);
    const nextLeaveType = summarizeLeaveType(dailyDraft);

    setRequests((current) =>
      current.map((row) =>
        row.id === activeRequest.id
          ? {
              ...row,
              leaveType: nextLeaveType,
              status: nextStatus,
              dailyDecisions: dailyDraft,
            }
          : row,
      ),
    );

    setActiveRequest((current) =>
      current
        ? {
            ...current,
            leaveType: nextLeaveType,
            status: nextStatus,
            dailyDecisions: dailyDraft,
          }
        : current,
    );

    setIsApplyConfirmOpen(false);
  }

  function requestApplyDailyChanges() {
    if (!activeRequest) return;
    setIsApplyConfirmOpen(true);
  }

  function getStatusMeta(status: HrApprovalStatus): {
    label: string;
    className: string;
  } {
    if (status === "approved_with_pay") {
      return {
        label: "Approved With Pay",
        className:
          "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200",
      };
    }

    if (status === "approved_without_pay") {
      return {
        label: "Approved Without Pay",
        className:
          "inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200",
      };
    }

    if (status === "disapproved") {
      return {
        label: "Disapproved",
        className:
          "inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200",
      };
    }

    if (status === "cancelled") {
      return {
        label: "Cancelled",
        className:
          "inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-300",
      };
    }

    return {
      label: "Pending",
      className:
        "inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200",
    };
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
              <option value="all">All Statuses</option>
              <option value="approved_with_pay">Approved With Pay</option>
              <option value="approved_without_pay">Approved Without Pay</option>
              <option value="disapproved">Disapproved</option>
              <option value="cancelled">Cancelled</option>
              <option value="pending">Pending</option>
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

        <div className="space-y-3 p-3 sm:p-4">
          {filteredRequests.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-4 transition-colors hover:bg-slate-50 sm:px-5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="text-muted-foreground flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-100 text-xs font-semibold ring-1 ring-slate-300">
                  {getInitials(row.employee)}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-semibold">{row.employee}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {row.department} • {row.leaveType} • {row.dates} •{" "}
                    {row.days}
                    day{row.days > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={getStatusMeta(row.status).className}>
                  {getStatusMeta(row.status).label}
                </span>
                <button
                  type="button"
                  onClick={() => openDetails(row)}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90"
                >
                  View Details
                  <span aria-hidden="true">&gt;</span>
                </button>
              </div>
            </div>
          ))}

          {filteredRequests.length === 0 && (
            <div className="text-muted-foreground rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm">
              No HR requests match the selected filters.
            </div>
          )}
        </div>
      </section>

      <Sheet open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <SheetContent side="right" className="sm:max-w-4xl lg:max-w-6xl">
          <SheetHeader className="border-b bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] pb-4">
            <SheetTitle className="text-lg">View HR Approval</SheetTitle>
            <SheetDescription>
              Review request details and update HR approval status.
            </SheetDescription>
          </SheetHeader>

          {activeRequest ? (
            <div className="space-y-5 px-4 py-4 pb-6">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-muted-foreground flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-100 text-xs font-semibold ring-1 ring-slate-300">
                  {getInitials(activeRequest.employee)}
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {activeRequest.employee}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Request {activeRequest.id}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">
                      Department
                    </p>
                    <p className="font-medium">{activeRequest.department}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">
                      Leave Type
                    </p>
                    <p className="font-medium">{activeRequest.leaveType}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">
                      Number of Days
                    </p>
                    <p className="font-medium">{activeRequest.days}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">
                      Covered Dates
                    </p>
                    <p className="font-medium">{activeRequest.dates}</p>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    Overall Status
                  </p>
                  <div className="pt-1">
                    <span
                      className={getStatusMeta(activeRequest.status).className}
                    >
                      {getStatusMeta(activeRequest.status).label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                    Daily Decisions
                  </p>
                  <button
                    type="button"
                    onClick={requestApplyDailyChanges}
                    className="inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Apply Daily Changes
                  </button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-[980px] w-full border-separate border-spacing-0">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="border-b border-slate-200 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Date
                        </th>
                        <th className="border-b border-slate-200 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Leave Type
                        </th>
                        <th className="border-b border-slate-200 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Approval Status
                        </th>
                        <th className="border-b border-slate-200 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          HR Remarks
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyDraft.map((entry) => (
                        <tr key={entry.dayNumber} className="align-top">
                          <td className="border-b border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700">
                            {entry.actualDate}
                          </td>
                          <td className="border-b border-slate-200 px-3 py-3">
                            <select
                              value={entry.leaveType}
                              onChange={(
                                event: React.ChangeEvent<HTMLSelectElement>,
                              ) =>
                                updateDraftDecision(
                                  entry.dayNumber,
                                  "leaveType",
                                  event.target.value,
                                )
                              }
                              className="h-9 w-full rounded-lg border border-slate-300 bg-background px-2.5 text-sm shadow-sm transition-colors focus:border-primary"
                            >
                              {LEAVE_TYPE_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="border-b border-slate-200 px-3 py-3">
                            <select
                              value={entry.status}
                              onChange={(
                                event: React.ChangeEvent<HTMLSelectElement>,
                              ) =>
                                updateDraftDecision(
                                  entry.dayNumber,
                                  "status",
                                  event.target.value as HrApprovalStatus,
                                )
                              }
                              className="h-9 w-full rounded-lg border border-slate-300 bg-background px-2.5 text-sm shadow-sm transition-colors focus:border-primary"
                            >
                              <option value="pending">Pending</option>
                              <option value="approved_with_pay">
                                Approved With Pay
                              </option>
                              <option value="approved_without_pay">
                                Approved Without Pay
                              </option>
                              <option value="disapproved">Disapproved</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="border-b border-slate-200 px-3 py-3">
                            <textarea
                              value={entry.hrRemarks}
                              onChange={(
                                event: React.ChangeEvent<HTMLTextAreaElement>,
                              ) =>
                                updateDraftDecision(
                                  entry.dayNumber,
                                  "hrRemarks",
                                  event.target.value,
                                )
                              }
                              placeholder="Add HR remarks for this day"
                              rows={1}
                              className="h-9 w-full resize-none rounded-lg border border-slate-300 bg-background px-2.5 py-2 text-sm shadow-sm transition-colors focus:border-primary"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsApplyConfirmOpen(false);
                    setIsViewModalOpen(false);
                  }}
                  className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
                >
                  Close
                </button>
              </div>

              {isApplyConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                  <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                    <h3 className="text-base font-semibold text-slate-900">
                      Confirm Apply Changes
                    </h3>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                      Apply all per-day leave type and approval status updates
                      for this request?
                    </p>

                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsApplyConfirmOpen(false)}
                        className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={applyDailyChanges}
                        className="inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
