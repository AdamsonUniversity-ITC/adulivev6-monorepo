import DataTableSearchBar from "@/components/shared/datatable/DataTableSearchBar.tsx";
import DataTableServerPagination from "@/components/shared/datatable/DataTableServerPagination.tsx";
import type {
  DatatableConfig,
  DataTableStates,
  RecordPagination,
  TanstackType,
} from "@/components/shared/datatable/types.ts";
import { Button } from "@/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
  Table as DTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils";
import { type ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type VisibilityState, type SortingState } from "@tanstack/react-table";
import React, { type ReactNode } from "react";

export type { DatatableConfig, DataTableStates, RecordPagination, TanstackType };

interface DataTableTanstackProps<TData = unknown> {
  tanstack: TanstackType;
  data: RecordPagination;
  states: DataTableStates;
  config: DatatableConfig;
  columns: ColumnDef<TData, unknown>[];
  styles?: {
    table?: string;
    wrapper?: string;
    searchContainer?: string;
    searchbar?: string;
  };
  bulkActions?: (table: ReturnType<typeof useReactTable<TData>>) => ReactNode;
  children?: ReactNode;
}

const getColumnMenuLabel = (header: unknown, id: string): string => {
  if (typeof header === "string" && header.trim().length > 0) {
    return header;
  }
  // Fallback for JSX/function headers so they still appear in the visibility menu.
  return id
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .trim();
}

/**
 * TanStack-only data table. Use with `useDataTable()` (see
 * `./hooks/useDataTable.tsx`) so search,
 * page, and rows-per-page state live in the hook; the parent loads or slices the data
 * that matches that state (e.g. refetch from the server).
 *
 * Includes: column visibility dropdown, optional search field (supports
 * `config.searchMode`: "debounce" or "enter"),
 * optional pagination footer, loading and empty states, optional row double-click,
 * and an optional `bulkActions` slot below the grid.
 *
 * @template TData - Row model type; should match the generic on your `ColumnDef` list.
 * @param props - Full prop bag (`DataTableTanstackProps`).
 * @param props.tanstack - `{ hook }` where `hook` is the return value of `useDataTable()`.
 * @param props.data - Paginated payload (`RecordPagination`): `data` is the current page
 *   of rows; includes `total`, `current_page`, `last_page`, `path`, etc.
 * @param props.states - UI state; set `isFetching: true` to show the loading row.
 * @param props.config - Toggle `search`, `pagination`, optional `searchMode`/`searchDebounceMs`,
 *   and optional `fn.onDoubleClick`.
 * @param props.columns - `@tanstack/react-table` column definitions for `TData`.
 * @param props.styles - Optional Tailwind (or other) classes for table, wrapper, search row.
 * @param props.bulkActions - Optional render function receiving the TanStack table instance.
 * @param props.children - Rendered beside the search bar (e.g. extra filter controls).
 * @returns The composed table UI (toolbar, table, bulk actions, pagination).
 */
function DataTable<TData = unknown>({
  tanstack,
  data,
  states,
  columns,
  config,
  styles,
  bulkActions = () => <></>,
  children,
}: DataTableTanstackProps<TData>): ReactNode {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data: (data?.data ?? []) as TData[],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true,
    state: {
      columnVisibility,
      sorting,
    },
  });

  const columnCount = columns.length;

  return (
    <>
      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-2">
        <div className={cn("", styles?.searchContainer)}>
          {config?.search && (
            <DataTableSearchBar
              tanstack={tanstack}
              mode={config?.searchMode}
              debounceMs={config?.searchDebounceMs}
              data={{ placeholder: config?.searchPlaceholder }}
              styles={{ input: `h-9 text-sm ${styles?.searchbar ?? ""}` }}
            />
          )}
          {children}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="ml-auto text-xs">
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                // if (typeof column.columnDef.header === "string") {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="text-xs capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }>
                    {getColumnMenuLabel(column.columnDef.header, column.id)}
                    </DropdownMenuCheckboxItem>
                  );
                // }
                // return null;
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className={cn("", styles?.wrapper)}>
        <DTable className={cn("", styles?.table)}>
          <TableHeader className="rounded-xl">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="text-xs font-semibold">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {states.isFetching ? (
            Array.from({ length: 4 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={columnCount} className="py-2">
                  <Skeleton className="h-16 w-full rounded-lg" />
                </TableCell>
              </TableRow>
            ))
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row, index) => {
              const customRowClassName = config?.fn?.getRowClassName?.(row);

              return (
              <TableRow
                onClick={() => {
                  if (config?.fn?.onClick) {
                    config.fn.onClick(row);
                  }
                }}
                onDoubleClick={() => {
                  if (config?.fn?.onDoubleClick) {
                    config.fn.onDoubleClick(row);
                  }
                }}
                className={cn(
                  customRowClassName ??
                    (index % 2 === 0 ? "bg-gray-50" : "bg-white"),
                  config?.fn?.onClick || config?.fn?.onDoubleClick
                    ? "cursor-pointer"
                    : ""
                )}
                key={row.id}
                data-state={row.getIsSelected() && "selected"}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={
                      (cell.column.columnDef as { className?: string })
                        .className
                    }>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={columnCount}
                className="h-24 text-center">
                No result found.
              </TableCell>
            </TableRow>
          )}
          </TableBody>
        </DTable>
      </div>
      {bulkActions(table)}
      {!states.isFetching && config?.pagination && (
        <div className="mt-2">
          <DataTableServerPagination
            tanstack={tanstack}
            data={data}
          />
        </div>
      )}
    </>
  );
}

DataTable.displayName = "DataTable";

export default DataTable;
