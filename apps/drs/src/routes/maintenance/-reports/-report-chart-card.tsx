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
import {
  buildChartConfig,
  enrichChartData,
  type ChartDatum,
} from './-report-chart-utils.ts';

type ReportBarChartProps = {
  title: string;
  data: ChartDatum[];
};

export function ReportBarChart({ title, data }: ReportBarChartProps) {
  const chartData = enrichChartData(data);
  const config = buildChartConfig(data);

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
            <BarChart data={chartData}>
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
              <ChartTooltip
                content={<ChartTooltipContent nameKey="seriesKey" />}
              />
              <Bar dataKey="value" radius={4}>
                {chartData.map((item) => (
                  <Cell key={item.seriesKey} fill={item.fill} />
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
  const chartData = enrichChartData(data);
  const config = buildChartConfig(data);

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
              <ChartTooltip
                content={<ChartTooltipContent nameKey="seriesKey" />}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="seriesKey"
                innerRadius={60}
                outerRadius={100}
              >
                {chartData.map((item) => (
                  <Cell key={item.seriesKey} fill={item.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
