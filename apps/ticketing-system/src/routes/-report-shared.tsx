import type { ReactNode } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@repo/ui/components/chart";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

export function formatPercent(rate: number | null | undefined) {
  if (rate === null || rate === undefined || Number.isNaN(rate)) return "—";
  return `${Math.round(rate * 100)}%`;
}

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
      {children}
    </h2>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground text-sm">{children}</p>;
}

export type FigureItem = {
  label: string;
  value: ReactNode;
  note?: ReactNode;
};

export function FigureList({ items }: { items: FigureItem[] }) {
  return (
    <dl className="divide-border divide-y text-sm">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-baseline justify-between gap-4 py-2"
        >
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd className="text-right tabular-nums">
            <span className="font-medium">{item.value}</span>
            {item.note ? (
              <span className="text-muted-foreground block text-xs">
                {item.note}
              </span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Thin horizontal bar for a 0..1 share. */
export function ShareBar({ share }: { share: number | null | undefined }) {
  const width =
    share === null || share === undefined
      ? 0
      : Math.min(100, Math.max(0, share * 100));

  return (
    <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full" aria-hidden>
      <div className="bg-primary h-full rounded-full" style={{ width: `${width}%` }} />
    </div>
  );
}

export type DistributionDatum = {
  label: string;
  count: number;
  highlight?: boolean;
};

const distributionConfig = {
  count: { label: "Tickets", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

/** Column chart where one bar (the peak) is drawn in the primary colour. */
export function DistributionChart({
  data,
  label,
  className = "h-44",
}: {
  data: DistributionDatum[];
  label: string;
  className?: string;
}) {
  return (
    <ChartContainer
      config={distributionConfig}
      className={`aspect-auto w-full ${className}`}
      aria-label={label}
    >
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={12}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={28}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="count" radius={3}>
          {data.map((item, index) => (
            <Cell
              key={`${item.label}-${index}`}
              fill={item.highlight ? "var(--primary)" : "var(--muted-foreground)"}
              fillOpacity={item.highlight ? 1 : 0.35}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
