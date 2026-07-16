import type { UseDataTableReturn } from "@/components/shared/datatable/hooks/useDataTable.tsx";

export type DatatableConfig = {
  search?: boolean;
  pagination?: boolean;
  /**
   * Controls when the search keyword is applied.
   * - "debounce": apply after typing (debounced)
   * - "enter": apply only when user presses Enter
   */
  searchMode?: "debounce" | "enter";
  /**
   * Debounce delay (ms) when `searchMode` is "debounce".
   */
  searchDebounceMs?: number;
  searchPlaceholder?: string;
  fn?: {
    onClick?: (row: unknown) => void;
    onDoubleClick?: (row: unknown) => void;
    getRowClassName?: (row: unknown) => string | undefined;
  };
};

export type TanstackType = {
  hook: UseDataTableReturn;
};

export type DataTableStates = {
  isFetching: boolean;
};

export type RecordPagination = {
  current_page: number;
  data: unknown[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: unknown[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
};
