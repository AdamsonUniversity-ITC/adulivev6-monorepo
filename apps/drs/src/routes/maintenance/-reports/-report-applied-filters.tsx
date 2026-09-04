import type { ReportFilters } from '@/api/reports.ts';
import { DrsStatusBadge } from '@/components/drs-ui.tsx';
import { describeAppliedFilters } from './-report-utils.ts';

type ReportAppliedFiltersProps = {
  filters: ReportFilters;
};

/** Caption stating what the figures below are actually counting. */
export function ReportAppliedFilters({ filters }: ReportAppliedFiltersProps) {
  const chips = describeAppliedFilters(filters);

  if (chips.length === 0) {
    return (
      <p className="text-muted-foreground text-xs">
        Showing all records. No filters applied.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-muted-foreground text-xs">Showing</span>
      {chips.map((chip) => (
        <DrsStatusBadge key={chip} tone="neutral">
          {chip}
        </DrsStatusBadge>
      ))}
    </div>
  );
}
