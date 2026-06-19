import { DrsStatCard } from '@/components/drs-ui.tsx';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type ReportKpiItem = {
  label: string;
  value: ReactNode;
  description?: ReactNode;
  tone?: 'blue' | 'amber' | 'emerald' | 'slate';
  icon?: LucideIcon;
};

type ReportKpiCardsProps = {
  items: ReportKpiItem[];
  'aria-label'?: string;
};

export function ReportKpiCards({
  items,
  'aria-label': ariaLabel = 'Report summary',
}: ReportKpiCardsProps) {
  return (
    <section
      className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-4"
      aria-label={ariaLabel}
    >
      {items.map((item) => (
        <DrsStatCard
          key={item.label}
          label={item.label}
          value={item.value}
          description={item.description}
          tone={item.tone}
          icon={item.icon}
        />
      ))}
    </section>
  );
}
