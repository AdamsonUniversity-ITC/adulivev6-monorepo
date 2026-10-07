import type { ReportFilters } from '@/api/reports.ts';
import { DrsStatusBadge } from '@/components/drs-ui.tsx';
import {
  describeAppliedFilters,
  type ReportPeriodMode,
} from './-report-utils.ts';

type ReportAppliedFiltersProps = {
  filters: ReportFilters;
  periodMode?: ReportPeriodMode;
};

/** Caption stating what the figures below are actually counting. */
export function ReportAppliedFilters({
  filters,
  periodMode = 'range',
}: ReportAppliedFiltersProps) {
  const chips = describeAppliedFilters(filters, periodMode);

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
