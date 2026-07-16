import { DrsEmptyState } from '@/components/drs-ui.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';

type SimpleReportTableProps = {
  columns: string[];
  rows: Array<Array<string | number | null | undefined>>;
};

export function SimpleReportTable({ columns, rows }: SimpleReportTableProps) {
  if (rows.length === 0) {
    return (
      <DrsEmptyState
        title="No data for the selected filters"
        description="Try widening the date range or clearing one or more filters."
      />
    );
  }

  return (
    <div className="drs-card overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <TableCell key={`${rowIndex}-${cellIndex}`}>
                  {cell ?? '—'}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
