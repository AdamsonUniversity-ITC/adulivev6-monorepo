import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import * as React from 'react';

import { Checkbox } from '../../components/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/table';
import { cn } from '../../lib/utils';
import { DataTablePagination } from './datatable-pagination';
import { DataTableRowActions } from './datatable-row-actions';
import { DataTableToolbar } from './datatable-toolbar';
import type {
  ColumnFiltersState,
  DataTableColumn,
  DataTableFooterConfig,
  DataTableRowActionsConfig,
  DataTableSelectionConfig,
  DataTableServerConfig,
  DataTableStatusConfig,
  DataTableToolbarConfig,
  DataTableVisibilityConfig,
  Row,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from './types';

export type DataTableProps<TData, TValue = unknown> = {
  data: TData[];
  columns: DataTableColumn<TData, TValue>[];
  getRowId?: (row: TData, index: number, parent?: Row<TData>) => string;

  server: DataTableServerConfig;
  toolbar?: DataTableToolbarConfig<TData>;
  selection?: DataTableSelectionConfig;
  visibility?: DataTableVisibilityConfig;
  rowActions?: DataTableRowActionsConfig<TData>;
  onRowClick?: (row: Row<TData>) => void;
  status?: DataTableStatusConfig;
  footer?: DataTableFooterConfig;

  className?: string;
  tableClassName?: string;
};

export function DataTable<TData, TValue = unknown>({
  data,
  columns: columnsProp,
  getRowId,
  server,
  toolbar,
  selection,
  visibility,
  rowActions,
  onRowClick,
  status,
  footer,
  className,
  tableClassName,
}: DataTableProps<TData, TValue>) {
  const {
    pagination,
    sorting: serverSorting,
    filters: serverFilters,
    search: serverSearch,
  } = server;

  const hasServerSorting = Boolean(serverSorting);
  const hasServerFilters = Boolean(serverFilters);
  const hasServerSearch = Boolean(serverSearch);

  const [localSorting, setLocalSorting] = React.useState<SortingState>([]);
  const [localFilters, setLocalFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [localVisibility, setLocalVisibility] = React.useState<VisibilityState>(
    visibility?.initial ?? {},
  );
  const [localSelection, setLocalSelection] = React.useState<RowSelectionState>(
    {},
  );

  const effectiveSorting = hasServerSorting
    ? serverSorting!.state
    : localSorting;
  const effectiveFilters = hasServerFilters
    ? serverFilters!.state
    : localFilters;
  const effectiveVisibility =
    typeof visibility?.state !== 'undefined'
      ? visibility.state
      : localVisibility;
  const effectiveSelection =
    typeof selection?.state !== 'undefined' ? selection.state : localSelection;
  const effectiveSearch = hasServerSearch ? serverSearch!.value : '';

  const showToolbar = toolbar?.show !== false;
  const showSearch = toolbar?.search !== false && hasServerSearch;
  const searchPlaceholder = toolbar?.searchPlaceholder ?? 'Search…';
  const showViewOptions = toolbar?.viewOptions !== false;

  const enableRowSelection = selection?.enabled ?? false;
  const isLoading = status?.loading ?? false;
  const isError = status?.error ?? false;
  const emptyMessage = status?.emptyMessage ?? 'No results.';
  const errorMessage =
    status?.errorMessage ?? 'Something went wrong while loading this table.';
  const loadingMessage = status?.loadingMessage ?? 'Loading…';
  const hideFooter = footer?.hide ?? false;
  const pageSizeOptions = pagination.pageSizeOptions;

  const columns = React.useMemo<DataTableColumn<TData, TValue>[]>(() => {
    const result: DataTableColumn<TData, TValue>[] = [...columnsProp];

    if (enableRowSelection) {
      result.unshift({
        id: '__select',
        enableSorting: false,
        enableHiding: false,
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? 'indeterminate'
                  : false
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all rows"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
      } as DataTableColumn<TData, TValue>);
    }

    if (rowActions?.actions?.length) {
      result.push({
        id: '__actions',
        enableSorting: false,
        enableHiding: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DataTableRowActions
              row={row}
              actions={rowActions.actions}
              label={rowActions.label}
            />
          </div>
        ),
      } as DataTableColumn<TData, TValue>);
    }

    return result;
  }, [columnsProp, enableRowSelection, rowActions]);

  const table = useReactTable<TData>({
    data,
    columns,
    getRowId,
    manualPagination: true,
    manualSorting: hasServerSorting,
    manualFiltering: hasServerFilters || hasServerSearch,
    rowCount: pagination.rowCount,
    state: {
      sorting: effectiveSorting,
      columnFilters: effectiveFilters,
      pagination: pagination.state,
      columnVisibility: effectiveVisibility,
      rowSelection: effectiveSelection,
      globalFilter: effectiveSearch,
    },
    enableRowSelection,
    onSortingChange: (updater) =>
      hasServerSorting
        ? serverSorting!.onChange(updater)
        : setLocalSorting(updater),
    onColumnFiltersChange: (updater) =>
      hasServerFilters
        ? serverFilters!.onChange(updater)
        : setLocalFilters(updater),
    onPaginationChange: pagination.onChange,
    onColumnVisibilityChange: (updater) =>
      typeof visibility?.onChange === 'function'
        ? visibility.onChange(updater)
        : setLocalVisibility(updater),
    onRowSelectionChange: (updater) =>
      typeof selection?.onChange === 'function'
        ? selection.onChange(updater)
        : setLocalSelection(updater),
    onGlobalFilterChange: (updater: unknown) => {
      if (!hasServerSearch) return;
      const next =
        typeof updater === 'function'
          ? (updater as (old: string) => string)(effectiveSearch)
          : updater;
      const value = typeof next === 'string' ? next : '';
      serverSearch!.onChange(value);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: hasServerSorting ? undefined : getSortedRowModel(),
    getFilteredRowModel:
      hasServerFilters || hasServerSearch ? undefined : getFilteredRowModel(),
    globalFilterFn: 'includesString',
  });

  const searchHandler =
    showSearch && serverSearch
      ? (value: string) => serverSearch.onChange(value)
      : undefined;

  const colSpan = table.getVisibleLeafColumns().length || columns.length;

  const toolbarSlot = toolbar?.slot;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {showToolbar ? (
        <DataTableToolbar
          table={table}
          search={hasServerSearch ? effectiveSearch : undefined}
          onSearchChange={searchHandler}
          searchPlaceholder={searchPlaceholder}
          showViewOptions={showViewOptions}
        >
          {typeof toolbarSlot === 'function' ? toolbarSlot(table) : toolbarSlot}
        </DataTableToolbar>
      ) : null}

      <div className="rounded-md border">
        <Table className={tableClassName}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="text-muted-foreground h-24 text-center text-sm"
                >
                  {loadingMessage}
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="text-destructive h-24 text-center text-sm"
                >
                  {errorMessage}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="text-muted-foreground h-24 text-center text-sm"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  className={cn(onRowClick && 'cursor-pointer')}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!hideFooter ? (
        <DataTablePagination
          table={table}
          pageSizeOptions={pageSizeOptions}
          showSelectedCount={enableRowSelection}
        />
      ) : null}
    </div>
  );
}
