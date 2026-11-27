import type { TatReport } from "@/lib/aduts-api";
import { formatDuration } from "@/lib/format-duration";

import {
  DistributionChart,
  EmptyNote,
  FigureList,
  SectionHeading,
  ShareBar,
  formatPercent,
} from "./-report-shared";

export function ReportDemandTab({ report }: { report: TatReport }) {
  const volume = report.volume;
  const priorityMix = report.priority_mix ?? [];
  const categories = report.categories ?? [];
  const requestors = report.requestors ?? [];

  if (!volume) {
    return <EmptyNote>No demand data is available for this filter.</EmptyNote>;
  }

  const monthlyData = volume.months.map((month) => ({
    label: month.partial ? `${month.label} (to date)` : month.label,
    count: month.count,
    highlight: volume.peak?.month === month.month,
  }));

  const weekdayData = volume.weekdays.map((day) => ({
    label: day.day.slice(0, 3),
    count: day.count,
    highlight: day.day === volume.peak_weekday,
  }));

  const hourData = volume.hours.map((hour) => ({
    label: hour.label,
    count: hour.count,
    highlight: hour.label === volume.peak_hour,
  }));

  return (
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div>
          <SectionHeading>Tickets created by month</SectionHeading>
          {monthlyData.length === 0 ? (
            <EmptyNote>No tickets in this filter.</EmptyNote>
          ) : (
            <DistributionChart
              data={monthlyData}
              label="Tickets created by month"
              className="h-64"
            />
          )}
        </div>
        <div>
          <SectionHeading>Volume summary</SectionHeading>
          <FigureList
            items={[
              { label: "Tickets created", value: volume.total },
              {
                label: "Monthly average",
                value:
                  volume.monthly_average === null
                    ? "—"
                    : volume.monthly_average.toFixed(1),
                note:
                  volume.average_basis === "current_month"
                    ? "Current month to date"
                    : "Completed months",
              },
              {
                label: "Peak month",
                value: volume.peak?.label ?? "—",
                note: volume.peak ? `${volume.peak.count} tickets` : undefined,
              },
              { label: "Peak weekday", value: volume.peak_weekday ?? "—" },
              { label: "Peak hour", value: volume.peak_hour ?? "—" },
            ]}
          />
        </div>
      </section>

      <section className="grid gap-x-12 gap-y-8 md:grid-cols-2">
        <div>
          <SectionHeading>Tickets by weekday</SectionHeading>
          <DistributionChart data={weekdayData} label="Tickets by weekday" />
        </div>
        <div>
          <SectionHeading>Tickets by hour of day</SectionHeading>
          <DistributionChart data={hourData} label="Tickets by hour of day" />
        </div>
      </section>

      <section className="grid gap-x-12 gap-y-10 md:grid-cols-2">
        <div>
          <SectionHeading>Priority mix</SectionHeading>
          {priorityMix.length === 0 ? (
            <EmptyNote>No tickets in this filter.</EmptyNote>
          ) : (
            <ul className="space-y-3 text-sm">
              {priorityMix.map((row) => (
                <li key={row.priority} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-medium capitalize">{row.priority}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {row.count} · {formatPercent(row.share)}
                    </span>
                  </div>
                  <ShareBar share={row.share} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <SectionHeading>Top categories</SectionHeading>
          {categories.length === 0 ? (
            <EmptyNote>No tickets in this filter.</EmptyNote>
          ) : (
            <ul className="space-y-3 text-sm">
              {categories.map((row, index) => (
                <li
                  key={`${row.kind}-${row.category_id ?? index}`}
                  className="space-y-1"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="min-w-0">
                      <span className="font-medium">{row.name}</span>
                      {row.section_name ? (
                        <span className="text-muted-foreground">
                          {" "}
                          · {row.section_name}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-muted-foreground shrink-0 tabular-nums">
                      {row.count} · {formatPercent(row.share)}
                    </span>
                  </div>
                  <ShareBar share={row.share} />
                  <p className="text-muted-foreground text-xs tabular-nums">
                    Avg resolve {formatDuration(row.avg_resolve_hours)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="max-w-2xl">
        <SectionHeading>Top requestors</SectionHeading>
        {requestors.length === 0 ? (
          <EmptyNote>No tickets in this filter.</EmptyNote>
        ) : (
          <ul className="divide-border divide-y text-sm">
            {requestors.map((row) => (
              <li
                key={row.user_id}
                className="flex items-baseline justify-between gap-4 py-2"
              >
                <span className="font-medium">
                  {row.name?.trim() || `User #${row.user_id}`}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {row.count} · {formatPercent(row.share)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
