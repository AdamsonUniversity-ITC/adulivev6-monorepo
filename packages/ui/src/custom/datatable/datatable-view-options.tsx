import type { Table } from '@tanstack/react-table';
import { Settings2 } from 'lucide-react';

import { Button } from '../../components/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/dropdown-menu';

type Props<TData> = {
  table: Table<TData>;
  label?: React.ReactNode;
};

export function DataTableViewOptions<TData>({
  table,
  label = 'Toggle columns',
}: Props<TData>) {
  const hideable = table
    .getAllColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== 'undefined' && column.getCanHide(),
    );

  if (hideable.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 lg:flex"
        >
          <Settings2 />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        {label ? <DropdownMenuLabel>{label}</DropdownMenuLabel> : null}
        {label ? <DropdownMenuSeparator /> : null}
        {hideable.map((column) => {
          const meta = column.columnDef.meta as { label?: string } | undefined;
          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              className="capitalize"
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              {meta?.label ?? column.id}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
