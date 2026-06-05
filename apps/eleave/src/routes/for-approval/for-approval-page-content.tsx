import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../components/ui/sheet.js";

type ApprovalStatus = "approved" | "disapproved" | "pending";
type ApprovalRequest = {
  id: string;
  employee: string;
  leaveType: string;
  dates: string;
  days: number;
  year: number;
  status: ApprovalStatus;
};

const INITIAL_REQUESTS: ApprovalRequest[] = [
  {
    id: "FA-1002",
    employee: "Mica Santos",
    leaveType: "Sick Leave",
    dates: "Jun 7, 2026",
    days: 1,
    year: 2026,
    status: "approved" as ApprovalStatus,
  },
  {
    id: "FA-1004",
    employee: "Kaye Lim",
    leaveType: "Emergency Leave",
    dates: "Jun 6-8, 2026",
    days: 3,
    year: 2026,
    status: "disapproved" as ApprovalStatus,
  },
  {
    id: "FA-1001",
    employee: "Ramon Dela Cruz",
    leaveType: "Vacation Leave",
    dates: "Jun 10-12, 2026",
    days: 3,
    year: 2026,
    status: "approved" as ApprovalStatus,
  },
  {
    id: "FA-1003",
    employee: "Neil Bautista",
    leaveType: "Special Purpose Leave",
    dates: "Jun 15, 2026",
    days: 1,
    year: 2026,
    status: "pending" as ApprovalStatus,
  },
  {
    id: "FA-0954",
    employee: "Iris Mendoza",
    leaveType: "Vacation Leave",
    dates: "Dec 12-13, 2025",
    days: 2,
    year: 2025,
    status: "approved" as ApprovalStatus,
  },
  {
    id: "FA-0946",
    employee: "Jules Aquino",
    leaveType: "Sick Leave",
    dates: "Nov 21, 2025",
    days: 1,
    year: 2025,
    status: "pending" as ApprovalStatus,
  },
];

export function ForApprovalPageContent() {
  const [requests, setRequests] =
    React.useState<ApprovalRequest[]>(INITIAL_REQUESTS);

  const years = Array.from(new Set(requests.map((row) => row.year))).sort(
    (a, b) => b - a,
  );
  const [selectedYear, setSelectedYear] = React.useState<string>("all");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("pending");
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
  const [pendingStatusChange, setPendingStatusChange] =
    React.useState<ApprovalStatus | null>(null);
  const [activeRequest, setActiveRequest] =
    React.useState<ApprovalRequest | null>(null);

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

  function openDetails(row: ApprovalRequest) {
    setActiveRequest(row);
    setPendingStatusChange(null);
    setIsViewModalOpen(true);
  }

  function updateActiveRequestStatus(nextStatus: ApprovalStatus) {
    if (!activeRequest) return;

    setRequests((current) =>
      current.map((row) =>
        row.id === activeRequest.id ? { ...row, status: nextStatus } : row,
      ),
    );

    setActiveRequest((current) =>
      current ? { ...current, status: nextStatus } : current,
    );

    setPendingStatusChange(null);
  }

  function requestStatusChange(nextStatus: ApprovalStatus) {
    setPendingStatusChange(nextStatus);
  }

  function getStatusMeta(status: ApprovalStatus): {
    label: string;
    className: string;
  } {
    if (status === "disapproved") {
      return {
        label: "Disapproved",
        className:
          "inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200",
      };
    }

    if (status === "pending") {
      return {
        label: "Pending",
        className:
          "inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200",
      };
    }

    return {
      label: "Approved",
      className:
        "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200",
    };
  }

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
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm sm:text-base">
            Review leave applications, filter by year and status, then update
            decisions directly from the details panel.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm">
          {filteredRequests.length} matching request
          {filteredRequests.length === 1 ? "" : "s"}
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
          <p className="text-muted-foreground text-sm mt-1">
            Select a request to open details and update approval status.
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
                    {row.leaveType} • {row.dates} • {row.days} day
                    {row.days > 1 ? "s" : ""}
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
              No leave requests match the selected filters.
            </div>
          )}
        </div>
      </section>

      <Sheet open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader className="border-b bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] pb-4">
            <SheetTitle className="text-lg">View For Approval</SheetTitle>
            <SheetDescription>
              Review leave details and update application status.
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
                      Leave Type
                    </p>
                    <p className="font-medium">{activeRequest.leaveType}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">
                      Number of Days
                    </p>
                    <p className="font-medium">{activeRequest.days}</p>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    Covered Dates
                  </p>
                  <p className="font-medium">{activeRequest.dates}</p>
                </div>

                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    Current Status
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
                <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wide">
                  Change Status
                </p>

                <div className="grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => requestStatusChange("approved")}
                    disabled={activeRequest.status === "approved"}
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => requestStatusChange("disapproved")}
                    disabled={activeRequest.status === "disapproved"}
                    className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Disapprove
                  </button>
                  <button
                    type="button"
                    onClick={() => requestStatusChange("pending")}
                    disabled={activeRequest.status === "pending"}
                    className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Set Pending
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
                >
                  Close
                </button>
              </div>

              {pendingStatusChange && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                  <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                    <h3 className="text-base font-semibold text-slate-900">
                      Confirm Status Change
                    </h3>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                      Change this leave request to{" "}
                      <span className="font-semibold text-slate-900">
                        {getStatusMeta(pendingStatusChange).label}
                      </span>
                      ?
                    </p>

                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setPendingStatusChange(null)}
                        className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateActiveRequestStatus(pendingStatusChange)
                        }
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
