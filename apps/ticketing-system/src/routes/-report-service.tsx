import type { TatReport } from "@/lib/aduts-api";
import { formatDuration } from "@/lib/format-duration";

import {
  EmptyNote,
  FigureList,
  SectionHeading,
  ShareBar,
  formatPercent,
} from "./-report-shared";

export function ReportServiceTab({ report }: { report: TatReport }) {
  const { sla, backlog, csat, cancellations, reopens } = report;

  return (
    <div className="grid gap-x-12 gap-y-12 md:grid-cols-2">
      <section className="space-y-4">
        <SectionHeading>SLA compliance</SectionHeading>
        {sla ? (
          <>
            <p className="text-3xl font-semibold tabular-nums">
              {formatPercent(sla.compliance_rate)}
            </p>
            <p className="text-muted-foreground text-sm">
              {sla.target_hours
                ? `Resolved within the ${formatDuration(sla.target_hours)} target.`
                : "No resolution target is set for this board."}
            </p>
            <FigureList
              items={[
                {
                  label: "Resolved within target",
                  value: `${sla.met_count} of ${sla.resolved_count}`,
                },
                {
                  label: "Open past due",
                  value: sla.overdue_open_count,
                  note: "Open tickets beyond their due date",
                },
              ]}
            />
          </>
        ) : (
          <EmptyNote>No SLA data is available for this filter.</EmptyNote>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading>Backlog age</SectionHeading>
        {backlog ? (
          <>
            <p className="text-muted-foreground text-sm">
              {backlog.total} open {backlog.total === 1 ? "ticket" : "tickets"},
              grouped by time since creation.
            </p>
            <ul className="space-y-3 text-sm">
              {backlog.buckets.map((bucket) => (
                <li key={bucket.key} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-4">
                    <span>{bucket.label}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {bucket.count}
                    </span>
                  </div>
                  <ShareBar
                    share={backlog.total > 0 ? bucket.count / backlog.total : 0}
                  />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <EmptyNote>No backlog data is available for this filter.</EmptyNote>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading>Customer satisfaction</SectionHeading>
        {csat ? (
          <>
            <FigureList
              items={[
                {
                  label: "Average rating",
                  value:
                    csat.average === null
                      ? "—"
                      : `${csat.average.toFixed(2)} / 5`,
                  note: `${csat.rated_count} of ${csat.eligible_count} eligible tickets rated`,
                },
                {
                  label: "Response rate",
                  value: formatPercent(csat.response_rate),
                },
              ]}
            />
            {csat.rated_count > 0 ? (
              <ul className="space-y-3 pt-2 text-sm">
                {csat.distribution.map((row) => (
                  <li key={row.score} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-4">
                      <span>{row.score} out of 5</span>
                      <span className="text-muted-foreground tabular-nums">
                        {row.count}
                      </span>
                    </div>
                    <ShareBar share={row.count / csat.rated_count} />
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <EmptyNote>No satisfaction data is available for this filter.</EmptyNote>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading>Cancellations</SectionHeading>
        {cancellations ? (
          <>
            <FigureList
              items={[
                {
                  label: "Cancellation rate",
                  value: formatPercent(cancellations.rate),
                  note: `${cancellations.cancelled_count} cancelled`,
                },
                {
                  label: "Average time to cancel",
                  value: formatDuration(cancellations.avg_cancel_hours),
                },
                {
                  label: "Median time to cancel",
                  value: formatDuration(cancellations.median_cancel_hours),
                },
              ]}
            />
            {cancellations.reasons.length === 0 ? (
              <EmptyNote>No cancellations in this filter.</EmptyNote>
            ) : (
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Top reasons
                </p>
                <ul className="divide-border divide-y text-sm">
                  {cancellations.reasons.map((reason) => (
                    <li
                      key={reason.reason_id}
                      className="flex items-baseline justify-between gap-4 py-2"
                    >
                      <span>{reason.label}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {reason.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <EmptyNote>No cancellation data is available for this filter.</EmptyNote>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading>Reopens</SectionHeading>
        {reopens ? (
          <FigureList
            items={[
              {
                label: "Reopen rate",
                value: formatPercent(reopens.rate),
                note: "Share of tickets that reached Resolved or Closed and went back to Open",
              },
              {
                label: "Reopened",
                value: `${reopens.reopened_count} of ${reopens.ever_completed_count}`,
              },
            ]}
          />
        ) : (
          <EmptyNote>No reopen data is available for this filter.</EmptyNote>
        )}
      </section>
    </div>
  );
}
