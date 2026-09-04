import {
  DrsEmptyState,
  DrsErrorState,
  DrsLoadingState,
  DrsSearchField,
  DrsStatusBadge,
  formatStatusLabel,
  toneForStatus,
} from '@/components/drs-ui.tsx';
import { Button } from '@repo/ui/components/button';
import { DataTable } from '@repo/ui/custom/datatable/datatable';
import { DataTableColumnHeader } from '@repo/ui/custom/datatable/datatable-column-header';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import type {
  ColumnDef,
  PaginationState,
  SortingState,
} from '@tanstack/react-table';
import { ChevronRight } from 'lucide-react';
import * as React from 'react';

import { fetchApplications } from './-lib/api/fetchApplications.ts';
import {
  displayApplicationRef,
  type DRSApplicationRow as ApplicationRow,
} from './-lib/types/applications.ts';

const submittedAtFormatter = new Intl.DateTimeFormat('en-PH', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatSubmittedAt(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return submittedAtFormatter.format(d);
}

function formatReceiveMode(mode: ApplicationRow['receive_mode']): string {
  return mode === 'pickup' ? 'Pickup' : 'Delivery';
}

/**
 * A student is looking at their own requests, so identity columns (name,
 * student number, email) are noise. Reference, timing, and state are the
 * questions this table has to answer.
 */
const columns: ColumnDef<ApplicationRow>[] = [
  {
    accessorKey: 'drs_no',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reference" />
    ),
    meta: { label: 'Reference' },
    cell: ({ row }) => (
      <span className="font-medium tabular-nums">
        #{displayApplicationRef(row.original)}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Submitted" />
    ),
    meta: { label: 'Submitted' },
    cell: ({ getValue }) => (
      <span className="text-muted-foreground text-sm">
        {formatSubmittedAt(getValue() as string | null)}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    meta: { label: 'Status' },
    cell: ({ getValue }) => {
      const raw = String(getValue() ?? '');
      if (!raw.trim()) {
        return <span className="text-muted-foreground text-sm">—</span>;
      }
      return (
        <DrsStatusBadge tone={toneForStatus(raw)}>
          {formatStatusLabel(raw)}
        </DrsStatusBadge>
      );
    },
  },
  {
    accessorKey: 'receive_mode',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Receive by" />
    ),
    meta: { label: 'Receive by' },
    cell: ({ getValue }) => (
      <span className="text-sm">
        {formatReceiveMode(getValue() as ApplicationRow['receive_mode'])}
      </span>
    ),
  },
  {
    accessorKey: 'is_paid',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Payment" />
    ),
    meta: { label: 'Payment' },
    cell: ({ getValue }) =>
      (getValue() as boolean) ? (
        <DrsStatusBadge tone="success">Paid</DrsStatusBadge>
      ) : (
        <DrsStatusBadge tone="warning">Unpaid</DrsStatusBadge>
      ),
  },
  {
    accessorKey: 'school_year',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Term" />
    ),
    meta: { label: 'Term' },
    cell: ({ row }) => {
      const year = row.original.school_year?.trim();
      const semester = row.original.semester?.trim();
      if (!year && !semester) {
        return <span className="text-muted-foreground text-sm">—</span>;
      }
      return (
        <span className="text-muted-foreground text-sm">
          {[year, semester].filter(Boolean).join(' · ')}
        </span>
      );
    },
  },
];

export function ApplicationsDataTable() {
  const navigate = useNavigate();
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'created_at', desc: true },
  ]);
  const [search, setSearch] = React.useState('');

  const sort = sorting[0];
  const sortId = sort?.id ?? 'created_at';
  const order: 'asc' | 'desc' = sort?.desc ? 'desc' : 'asc';

  React.useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [sortId, order, search]);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['drs-applications', pagination, sortId, order, search],
    queryFn: () =>
      fetchApplications({
        page: pagination.pageIndex + 1,
        perPage: pagination.pageSize,
        sort: sortId,
        order,
        search,
      }),
    placeholderData: (prev) => prev,
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize));
  const canPrev = pagination.pageIndex > 0;
  const canNext = pagination.pageIndex + 1 < pageCount;

  const openApplication = (id: string) => {
    void navigate({
      to: '/applications/$applicationId',
      params: { applicationId: id },
    });
  };

  return (
    <>
      <div className="space-y-3 md:hidden">
        <DrsSearchField
          label="Search your requests"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by document, status, or reference…"
        />

        {isLoading && rows.length === 0 ? (
          <DrsLoadingState label="Loading your requests…" />
        ) : isError ? (
          <DrsErrorState description="Your requests could not be loaded. Check your connection and try again." />
        ) : rows.length === 0 ? (
          <DrsEmptyState
            title="No requests yet"
            description="When you request a document from the registrar, it will appear here so you can track it."
          />
        ) : (
          <ul className="divide-border/70 divide-y border-y">
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => openApplication(row.id)}
                  className="hover:bg-muted/40 focus-visible:ring-ring flex w-full items-center gap-3 py-3 text-left focus-visible:ring-2 focus-visible:outline-none"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums">
                        #{displayApplicationRef(row)}
                      </span>
                      {row.status?.trim() ? (
                        <DrsStatusBadge tone={toneForStatus(row.status)}>
                          {formatStatusLabel(row.status)}
                        </DrsStatusBadge>
                      ) : null}
                      <DrsStatusBadge
                        tone={row.is_paid ? 'success' : 'warning'}
                      >
                        {row.is_paid ? 'Paid' : 'Unpaid'}
                      </DrsStatusBadge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Submitted {formatSubmittedAt(row.created_at)}
                    </p>
                  </div>
                  <ChevronRight
                    className="text-muted-foreground size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="sr-only">Open request</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {total > pagination.pageSize ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-muted-foreground text-xs tabular-nums">
              Page {pagination.pageIndex + 1} of {pageCount}
              {isFetching ? ' · updating…' : ''}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canPrev}
                onClick={() =>
                  setPagination((p) => ({
                    ...p,
                    pageIndex: Math.max(0, p.pageIndex - 1),
                  }))
                }
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canNext}
                onClick={() =>
                  setPagination((p) => ({
                    ...p,
                    pageIndex: p.pageIndex + 1,
                  }))
                }
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="hidden space-y-2 md:block">
        <DataTable<ApplicationRow>
          columns={columns}
          data={rows}
          getRowId={(row) => row.id}
          onRowClick={(row) => openApplication(row.original.id)}
          server={{
            pagination: {
              rowCount: total,
              state: pagination,
              onChange: setPagination,
              pageSizeOptions: [10, 20, 30, 50],
            },
            sorting: {
              state: sorting,
              onChange: setSorting,
            },
            search: { value: search, onChange: setSearch },
          }}
          toolbar={{
            searchPlaceholder: 'Search by document, status, or reference…',
          }}
          status={{
            loading: isLoading || isFetching,
            error: isError,
            errorMessage:
              'Your requests could not be loaded. Check your connection and try again.',
            emptyMessage:
              'No requests yet. Use “Request a document” to submit your first one.',
          }}
        />

        <p className="text-muted-foreground text-xs tabular-nums">
          {total} request{total === 1 ? '' : 's'}
          {isFetching ? ' · updating…' : ''}
        </p>
      </div>
    </>
  );
}
