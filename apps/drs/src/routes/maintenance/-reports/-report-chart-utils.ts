import type { ChartConfig } from '@repo/ui/components/chart';

const CHART_COLOR_VARS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
] as const;

export type ChartDatum = {
  label: string;
  value: number;
};

export type EnrichedChartDatum = ChartDatum & {
  seriesKey: string;
  fill: string;
};

export function getChartColor(index: number): string {
  return CHART_COLOR_VARS[index % CHART_COLOR_VARS.length]!;
}

export function enrichChartData(data: ChartDatum[]): EnrichedChartDatum[] {
  return data.map((item, index) => {
    const seriesKey = `item${index}`;

    return {
      ...item,
      seriesKey,
      fill: `var(--color-${seriesKey})`,
    };
  });
}

export function buildChartConfig(data: ChartDatum[]): ChartConfig {
  const config: ChartConfig = {
    value: { label: 'Count' },
  };

  data.forEach((item, index) => {
    const seriesKey = `item${index}`;
    config[seriesKey] = {
      label: item.label,
      color: getChartColor(index),
    };
  });

  return config;
}
