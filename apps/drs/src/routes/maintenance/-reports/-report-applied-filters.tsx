import type { ReportFilters } from '@/api/reports.ts';
import { Badge } from '@repo/ui/components/badge';
import { describeAppliedFilters } from './-report-utils.ts';

type ReportAppliedFiltersProps = {
  filters: ReportFilters;
};

export function ReportAppliedFilters({ filters }: ReportAppliedFiltersProps) {
  const chips = describeAppliedFilters(filters);

  if (chips.length === 0) {
    return <p className="text-muted-foreground text-sm">Showing all records</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-sm font-medium">Showing</span>
      {chips.map((chip) => (
        <Badge key={chip} variant="secondary" className="rounded-full">
          {chip}
        </Badge>
      ))}
    </div>
  );
}
