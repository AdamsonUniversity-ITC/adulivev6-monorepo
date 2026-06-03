import type { ReactNode } from 'react';
import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  Row,
  RowSelectionState,
  SortingState,
  Table as TableInstance,
  VisibilityState,
} from '@tanstack/react-table';

export type DataTableColumn<TData, TValue = unknown> = ColumnDef<TData, TValue>;

export type DataTableRowAction<TData> = {
  label: ReactNode;
  onSelect: (row: Row<TData>) => void;
  hidden?: (row: Row<TData>) => boolean;
  disabled?: (row: Row<TData>) => boolean;
  separatorBefore?: boolean;
  destructive?: boolean;
};

/** Required: pagination is always manual / server-driven. */
export type DataTableServerPagination = {
  rowCount: number;
  state: PaginationState;
  onChange: OnChangeFn<PaginationState>;
  /** Options shown in the footer page-size select. */
  pageSizeOptions?: number[];
};

export type DataTableServerSorting = {
  state: SortingState;
  onChange: OnChangeFn<SortingState>;
};

export type DataTableServerFilters = {
  state: ColumnFiltersState;
  onChange: OnChangeFn<ColumnFiltersState>;
};

export type DataTableServerSearch = {
  value: string;
  onChange: (value: string) => void;
};

/** Server-backed table query state (pagination is always required). */
export type DataTableServerConfig = {
  pagination: DataTableServerPagination;
  sorting?: DataTableServerSorting;
  filters?: DataTableServerFilters;
  search?: DataTableServerSearch;
};

export type DataTableToolbarConfig<TData> = {
  show?: boolean;
  search?: boolean;
  searchPlaceholder?: string;
  viewOptions?: boolean;
  slot?: ReactNode | ((table: TableInstance<TData>) => ReactNode);
};

export type DataTableSelectionConfig = {
  enabled?: boolean;
  state?: RowSelectionState;
  onChange?: OnChangeFn<RowSelectionState>;
};

export type DataTableVisibilityConfig = {
  initial?: VisibilityState;
  state?: VisibilityState;
  onChange?: OnChangeFn<VisibilityState>;
};

export type DataTableRowActionsConfig<TData> = {
  actions: DataTableRowAction<TData>[];
  label?: ReactNode;
};

export type DataTableStatusConfig = {
  loading?: boolean;
  error?: boolean;
  emptyMessage?: ReactNode;
  errorMessage?: ReactNode;
  loadingMessage?: ReactNode;
};

export type DataTableFooterConfig = {
  hide?: boolean;
};

export type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  Row,
  RowSelectionState,
  SortingState,
  TableInstance,
  VisibilityState,
};
