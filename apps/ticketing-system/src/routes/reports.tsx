import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { AccessDeniedState } from "@/components/access-denied-state";
import { LoadingState } from "@/components/loading-state";
import { PageShell } from "@/components/page-shell";
import { PriorityBadge, StatusBadge } from "@/components/ticket-badges";
import { requireReportsAccess } from "@/lib/admin-guards";
import {
  fetchCurrentBoard,
  fetchTatReport,
  type TatStaffReport,
  type TatSummary,
} from "@/lib/aduts-api";
import { getAxiosStatus } from "@/lib/axios-status";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Label } from "@repo/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";

import { ReportDatePicker, parseReportDate } from "./-report-date-picker";

export const Route = createFileRoute("/reports")({
  beforeLoad: async ({ context }) => {
    await requireReportsAccess(context.queryClient);
  },
  component: ReportsPage,
});

function formatHours(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(2)}h`;
}

function MetricCard({
  title,
  summary,
  description,
}: {
  title: string;
  summary?: TatSummary;
  description: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <p className="text-2xl font-semibold tabular-nums">
          {formatHours(summary?.avg)}
        </p>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-muted-foreground space-y-1 text-sm">
        <p>Median {formatHours(summary?.median)}</p>
        <p>n={summary?.count ?? 0}</p>
      </CardContent>
    </Card>
  );
}

function StaffTatCard({ staff }: { staff: TatStaffReport }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              {staff.name?.trim() || "Unknown"}
            </CardTitle>
            <CardDescription>
              Assigned tickets in this filter:{" "}
              <span className="text-foreground font-medium tabular-nums">
                {staff.ticket_count}
              </span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            Create → Resolved
          </p>
          <p className="text-lg font-semibold tabular-nums">
            {formatHours(staff.overall.create_to_resolved.avg)}
          </p>
          <p className="text-muted-foreground text-xs">
            Median {formatHours(staff.overall.create_to_resolved.median)} · n=
            {staff.overall.create_to_resolved.count}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            Create → Closed
          </p>
          <p className="text-lg font-semibold tabular-nums">
            {formatHours(staff.overall.create_to_closed.avg)}
          </p>
          <p className="text-muted-foreground text-xs">
            Median {formatHours(staff.overall.create_to_closed.median)} · n=
            {staff.overall.create_to_closed.count}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            First Response
          </p>
          <p className="text-lg font-semibold tabular-nums">
            {formatHours(staff.overall.first_response.avg)}
          </p>
          <p className="text-muted-foreground text-xs">
            Median {formatHours(staff.overall.first_response.median)} · n=
            {staff.overall.first_response.count}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            Time to Assignment
          </p>
          <p className="text-lg font-semibold tabular-nums">
            {formatHours(staff.assignment_time.avg)}
          </p>
          <p className="text-muted-foreground text-xs">
            Median {formatHours(staff.assignment_time.median)} · n=
            {staff.assignment_time.count}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            Open dwell
          </p>
          <p className="tabular-nums">
            {formatHours(staff.per_status.open?.avg)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            In Progress dwell
          </p>
          <p className="tabular-nums">
            {formatHours(staff.per_status.in_progress?.avg)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            Resolved dwell
          </p>
          <p className="tabular-nums">
            {formatHours(staff.per_status.resolved?.avg)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            Closed dwell
          </p>
          <p className="tabular-nums">
            {formatHours(staff.per_status.closed?.avg)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);

  const boardQuery = useQuery({
    queryKey: ["aduts", "board"],
    queryFn: fetchCurrentBoard,
  });

  const reportQuery = useQuery({
    queryKey: [
      "aduts",
      "reports",
      "tat",
      from,
      to,
      sectionId,
      categoryId,
      page,
    ],
    queryFn: () =>
      fetchTatReport({
        from: from || undefined,
        to: to || undefined,
        section_id: sectionId ? Number(sectionId) : undefined,
        category_id: categoryId ? Number(categoryId) : undefined,
        page,
        per_page: 20,
      }),
  });

  const report = reportQuery.data;
  const meta = report?.per_application.meta;
  const scope = report?.scope;
  const isAdminScope = scope?.is_admin !== false;

  const sectionOptions = useMemo(() => {
    const sections = boardQuery.data?.sections ?? [];
    const allowed = scope?.allowed_section_ids ?? [];
    if (isAdminScope || allowed.length === 0) {
      return sections;
    }
    const allowedSet = new Set(allowed);
    return sections.filter((section) => allowedSet.has(section.id));
  }, [boardQuery.data?.sections, isAdminScope, scope?.allowed_section_ids]);

  useEffect(() => {
    if (isAdminScope) return;
    if (sectionOptions.length === 1) {
      const onlyId = String(sectionOptions[0]!.id);
      if (sectionId !== onlyId) {
        setSectionId(onlyId);
        setPage(1);
      }
      return;
    }
    if (
      sectionId &&
      !sectionOptions.some((section) => String(section.id) === sectionId)
    ) {
      setSectionId("");
      setPage(1);
    }
  }, [isAdminScope, sectionId, sectionOptions]);

  const showAllSectionsOption =
    isAdminScope || sectionOptions.length > 1;

  return (
    <PageShell
      width="wide"
      title="Reports"
      description="Turnaround time by status, overall resolution, per staff, and per ticket."
    >
      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter by ticket created date, section, or category.
              {!isAdminScope
                ? " Section heads only see their own section(s)."
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="tat-from">From</Label>
                <ReportDatePicker
                  id="tat-from"
                  value={from}
                  onChange={(value) => {
                    setFrom(value ?? "");
                    setPage(1);
                  }}
                  placeholder="Start date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tat-to">To</Label>
                <ReportDatePicker
                  id="tat-to"
                  value={to}
                  onChange={(value) => {
                    setTo(value ?? "");
                    setPage(1);
                  }}
                  placeholder="End date"
                  disabledDate={(date) => {
                    const fromDate = parseReportDate(from);
                    if (!fromDate) return false;
                    return date < fromDate;
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Select
                  value={sectionId || "all"}
                  onValueChange={(value) => {
                    setSectionId(value === "all" ? "" : value);
                    setPage(1);
                  }}
                  disabled={!isAdminScope && sectionOptions.length <= 1}
                >
                  <SelectTrigger className="shadow-xs">
                    <SelectValue placeholder="All sections" />
                  </SelectTrigger>
                  <SelectContent>
                    {showAllSectionsOption ? (
                      <SelectItem value="all">
                        {isAdminScope
                          ? "All sections"
                          : "All my sections"}
                      </SelectItem>
                    ) : null}
                    {sectionOptions.map((section) => (
                      <SelectItem key={section.id} value={String(section.id)}>
                        {section.section_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={categoryId || "all"}
                  onValueChange={(value) => {
                    setCategoryId(value === "all" ? "" : value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="shadow-xs">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {(boardQuery.data?.categories ?? []).map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {reportQuery.isLoading ? (
          <LoadingState label="Loading report…" />
        ) : null}
        {reportQuery.isError ? (
          getAxiosStatus(reportQuery.error) === 403 ? (
            <AccessDeniedState description="You do not have permission to view reports." />
          ) : (
            <p className="text-destructive text-sm">
              Could not load TAT report.
            </p>
          )
        ) : null}

        {report ? (
          <>
            <div>
              <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
                Overall
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  title="Create → Resolved"
                  summary={report.overall.create_to_resolved}
                  description="Average hours from ticket creation until marked resolved."
                />
                <MetricCard
                  title="Create → Closed"
                  summary={report.overall.create_to_closed}
                  description="Average hours from ticket creation until closed."
                />
                <MetricCard
                  title="First Response"
                  summary={report.overall.first_response}
                  description="Average hours until the first staff public reply."
                />
                <MetricCard
                  title="Time to Assignment"
                  summary={report.assignment_time}
                  description="Average hours until the ticket is first assigned."
                />
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
                Per Status Dwell
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  title="Open"
                  summary={report.per_status.open}
                  description="Average time tickets spend in Open status."
                />
                <MetricCard
                  title="In Progress"
                  summary={report.per_status.in_progress}
                  description="Average time tickets spend In Progress."
                />
                <MetricCard
                  title="Resolved"
                  summary={report.per_status.resolved}
                  description="Average time tickets remain Resolved before closing."
                />
                <MetricCard
                  title="Closed"
                  summary={report.per_status.closed}
                  description="Average dwell time recorded in Closed status."
                />
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
                Per Staff
              </h2>
              <p className="text-muted-foreground mb-3 text-sm">
                Same TAT metrics for each section member, based on tickets
                currently assigned to them.
              </p>
              {(report.per_staff ?? []).length > 0 ? (
                <div className="space-y-4">
                  {(report.per_staff ?? []).map((staff) => (
                    <StaffTatCard key={staff.user_id} staff={staff} />
                  ))}
                </div>
              ) : (
                <Card className="shadow-sm">
                  <CardContent className="text-muted-foreground py-8 text-center text-sm">
                    No section staff in this scope.
                  </CardContent>
                </Card>
              )}
            </div>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Per Application</CardTitle>
                <CardDescription>
                  TAT fields for each ticket in the filtered set.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[56rem] text-left text-sm">
                    <thead className="bg-muted/40 text-muted-foreground border-y text-xs tracking-wide uppercase">
                      <tr>
                        <th className="px-4 py-3 font-medium">Ticket</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Priority</th>
                        <th className="px-4 py-3 font-medium">Open</th>
                        <th className="px-4 py-3 font-medium">In Progress</th>
                        <th className="px-4 py-3 font-medium">Resolve</th>
                        <th className="px-4 py-3 font-medium">Close</th>
                        <th className="px-4 py-3 font-medium">1st Resp.</th>
                        <th className="px-4 py-3 font-medium">Assign</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {report.per_application.data.map((row) => (
                        <tr key={row.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <Link
                              to="/tickets/$ticketNumber"
                              params={{ ticketNumber: row.ticket_number }}
                              className="text-primary font-medium hover:underline"
                            >
                              {row.ticket_number}
                            </Link>
                            <p className="text-muted-foreground mt-0.5 max-w-[16rem] truncate text-xs">
                              {row.title}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={row.status} />
                          </td>
                          <td className="px-4 py-3">
                            <PriorityBadge priority={row.priority} />
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {formatHours(row.status_hours.open)}
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {formatHours(row.status_hours.in_progress)}
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {formatHours(row.resolve_hours)}
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {formatHours(row.close_hours)}
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {formatHours(row.first_response_hours)}
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {formatHours(row.assignment_hours)}
                          </td>
                        </tr>
                      ))}
                      {report.per_application.data.length === 0 ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="text-muted-foreground px-4 py-8 text-center"
                          >
                            No tickets in this range.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>

                {meta && meta.last_page > 1 ? (
                  <div className="flex items-center justify-between border-t px-4 py-3">
                    <p className="text-muted-foreground text-sm">
                      Page {meta.current_page} of {meta.last_page} ·{" "}
                      {meta.total} tickets
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={page >= meta.last_page}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </PageShell>
  );
}
