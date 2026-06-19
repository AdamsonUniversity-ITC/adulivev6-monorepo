import { DrsEmptyState } from '@/components/drs-ui.tsx';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@repo/ui/components/chart';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

type ChartDatum = {
  label: string;
  value: number;
};

type ReportBarChartProps = {
  title: string;
  data: ChartDatum[];
};

export function ReportBarChart({ title, data }: ReportBarChartProps) {
  const config = Object.fromEntries(
    data.map((item, index) => [
      item.label,
      { label: item.label, color: CHART_COLORS[index % CHART_COLORS.length] },
    ]),
  );

  return (
    <Card className="drs-card overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <DrsEmptyState
            title="No chart data"
            description="No data matches the selected filters."
            className="border-0 bg-transparent"
          />
        ) : (
          <ChartContainer
            config={config}
            className="aspect-[16/9] min-h-[280px] w-full"
            aria-label={title}
          >
            <BarChart data={data}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={72}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" radius={4}>
                {data.map((item, index) => (
                  <Cell
                    key={item.label}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

type ReportPieChartProps = {
  title: string;
  data: ChartDatum[];
};

export function ReportPieChart({ title, data }: ReportPieChartProps) {
  const config = Object.fromEntries(
    data.map((item, index) => [
      item.label,
      { label: item.label, color: CHART_COLORS[index % CHART_COLORS.length] },
    ]),
  );

  return (
    <Card className="drs-card overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <DrsEmptyState
            title="No chart data"
            description="No data matches the selected filters."
            className="border-0 bg-transparent"
          />
        ) : (
          <ChartContainer
            config={config}
            className="aspect-square min-h-[280px] w-full max-w-md"
            aria-label={title}
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                innerRadius={60}
                outerRadius={100}
              >
                {data.map((item, index) => (
                  <Cell
                    key={item.label}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
