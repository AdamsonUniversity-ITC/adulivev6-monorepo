import type { RecordPagination, TanstackType } from "@/components/shared/datatable/types";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@repo/ui/components/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import React, { useMemo } from "react";

export type DataTableServerPaginationProps = {
  tanstack: TanstackType;
  data: RecordPagination;
};

const DataTableServerPagination = React.memo(
  ({ tanstack, data }: DataTableServerPaginationProps) => {
    const { hook } = tanstack;
    const { setPage, rows, setRows } = hook;

    const pages = useMemo(() => {
      if (!data?.data) return [];
      let currentPage = data?.current_page ?? 1;
      const lastPage = data?.last_page ?? 1;
      const pageArr: { label: number; value: number }[] = [];
      let pageCount = 1;
      while (currentPage <= lastPage && pageCount <= 3) {
        pageArr.push({
          label: currentPage,
          value: currentPage,
        });
        currentPage++;
        pageCount++;
      }
      return pageArr;
    }, [data?.current_page, data?.last_page, data?.data]);

    if (!data?.data) {
      return null;
    }

    return (
      <div className="flex flex-col items-center justify-between gap-4 py-5 lg:flex-row">
        <p className="text-sm font-bold">
          Showing: <span>{Math.min(rows, data?.data?.length ?? 0)}</span> of{" "}
          <span>{data?.total}</span>
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Rows per page:</p>
            <Select
              value={String(rows)}
              onValueChange={(row) => {
                setRows(Number(row))
                // Changing page size should reset to first page.
                setPage(1)
              }}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                position="popper"
                side="top"
                align="end"
                sideOffset={6}
                className="bg-white border shadow-md">
                {[10, 15, 20, 50].map((count) => (
                  <SelectItem
                    key={count}
                    value={String(count)}>
                    {count}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationLink
                    className={cn(
                      "",
                      Number(data.current_page) === 1
                        ? "pointer-events-none text-gray-400"
                        : ""
                    )}
                    onClick={() => setPage(1)}>
                    <ChevronsLeft />
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    className={cn(
                      "",
                      Number(data.current_page) === 1
                        ? "pointer-events-none text-gray-400"
                        : ""
                    )}
                    onClick={() =>
                      setPage((prev: number) => (prev <= 1 ? 1 : prev - 1))
                    }>
                    <ChevronLeft />
                  </PaginationLink>
                </PaginationItem>
                {pages.map((page) => (
                  <PaginationItem key={page.value}>
                    <PaginationLink
                      onClick={() => {
                        setPage(page.value);
                      }}
                      isActive={page.value === data.current_page}>
                      {page.label}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationLink
                    onClick={() => setPage(data?.current_page + 1)}
                    className={cn(
                      "",
                      Number(data.current_page) === Number(data.last_page)
                        ? "pointer-events-none text-gray-400"
                        : ""
                    )}>
                    <ChevronRight />
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    onClick={() => setPage(data.last_page)}
                    className={cn(
                      "",
                      Number(data.current_page) === Number(data.last_page)
                        ? "pointer-events-none text-gray-400"
                        : ""
                    )}>
                    <ChevronsRight />
                  </PaginationLink>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    );
  },
);

DataTableServerPagination.displayName = "DataTableServerPagination";

export default DataTableServerPagination;
