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
        title="No data for these filters"
        description="Nothing matched. Widen the date range or clear one of the filters above."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
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
