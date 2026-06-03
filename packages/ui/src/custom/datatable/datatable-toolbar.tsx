import type { Table } from '@tanstack/react-table';
import { Search, X } from 'lucide-react';
import * as React from 'react';

import { Button } from '../../components/button';
import { Input } from '../../components/input';
import { DataTableViewOptions } from './datatable-view-options';

type Props<TData> = {
  table: Table<TData>;
  /** Current search value; shown in the built-in input. */
  search?: string;
  /** Provided = built-in search input is rendered. Omit to hide the search box. */
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** Custom slot — rendered after the search input (e.g. faceted filters). */
  children?: React.ReactNode;
  showViewOptions?: boolean;
};

export function DataTableToolbar<TData>({
  table,
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  children,
  showViewOptions = true,
}: Props<TData>) {
  const hasSearch = typeof onSearchChange === 'function';
  const hasActiveFilters =
    (typeof search === 'string' && search.length > 0) ||
    table.getState().columnFilters.length > 0;

  const handleReset = () => {
    if (hasSearch) {
      onSearchChange!('');
    }
    table.resetColumnFilters();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      {hasSearch ? (
        <div className="relative w-full max-w-sm">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-8"
            value={search ?? ''}
            onChange={(event) => onSearchChange!(event.target.value)}
            aria-label="Search table"
          />
        </div>
      ) : null}

      {children}

      {hasActiveFilters ? (
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Reset
          <X />
        </Button>
      ) : null}

      {showViewOptions ? <DataTableViewOptions table={table} /> : null}
    </div>
  );
}
