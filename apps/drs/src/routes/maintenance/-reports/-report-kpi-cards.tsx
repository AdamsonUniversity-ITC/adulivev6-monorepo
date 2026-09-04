import { DrsFigure } from '@/components/drs-ui.tsx';
import type { ReactNode } from 'react';

type ReportKpiItem = {
  label: string;
  value: ReactNode;
  description?: ReactNode;
};

type ReportKpiCardsProps = {
  items: ReportKpiItem[];
  'aria-label'?: string;
};

/** Headline figures for a report tab. Values carry the emphasis, not containers. */
export function ReportKpiCards({
  items,
  'aria-label': ariaLabel = 'Report summary',
}: ReportKpiCardsProps) {
  return (
    <section
      className="border-border/70 grid grid-cols-2 gap-x-6 gap-y-5 border-b pb-5 md:grid-cols-4"
      aria-label={ariaLabel}
    >
      {items.map((item) => (
        <DrsFigure
          key={item.label}
          label={item.label}
          value={item.value}
          description={item.description}
        />
      ))}
    </section>
  );
}
