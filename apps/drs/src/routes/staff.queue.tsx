import {
  DrsEmptyState,
  DrsErrorState,
  DrsLoadingState,
  DrsPageHeader,
  DrsPageShell,
  DrsSearchField,
  DrsStatusBadge,
  formatStatusLabel,
  toneForStatus,
} from '@/components/drs-ui.tsx';
import { getDrSubdomain } from '@/lib/drsPermissions.ts';
import { Label } from '@repo/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import { DataTable } from '@repo/ui/custom/datatable/datatable';
import { DataTableColumnHeader } from '@repo/ui/custom/datatable/datatable-column-header';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';
import { ChevronRight } from 'lucide-react';
import * as React from 'react';

import { fetchEmployeeApplications } from './-lib/api/fetchEmployeeApplications.ts';
import { fetchWorkflowStageAccess } from './-lib/api/fetchWorkflowStageAccess.ts';
import { assertStaffPortalAccess } from './-lib/assertStaffPortalAccess.ts';
import {
  displayApplicationRef,
  type DRSApplicationRow,
} from './-lib/types/applications.ts';
import { useDebouncedValue } from './maintenance/-lib/hooks/useDebouncedValue.ts';

export const Route = createFileRoute('/staff/queue')({
  beforeLoad: assertStaffPortalAccess,
  component: StaffQueuePage,
});

const QUEUE_STATUS_STORAGE_PREFIX = 'drs.staff-queue.status';

function queueStatusStorageKey(): string {
  const subdomain =
    typeof window !== 'undefined'
      ? getDrSubdomain(window.location.hostname)
      : '';
  return `${QUEUE_STATUS_STORAGE_PREFIX}:${subdomain || 'default'}`;
}

function readStoredQueueStatus(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(queueStatusStorageKey()) ?? '';
  } catch {
    return '';
  }
}

function writeStoredQueueStatus(status: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = queueStatusStorageKey();
    if (status === '') {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, status);
    }
  } catch {
    // Ignore quota / private-mode failures.
  }
}

const columns: ColumnDef<DRSApplicationRow>[] = [
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
    accessorKey: 'student_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Student" />
    ),
    meta: { label: 'Student' },
    cell: ({ row }) => (
      <div className="min-w-0">
        <div className="max-w-56 truncate text-sm font-medium">
          {row.original.student_name?.trim()
            ? row.original.student_name
            : row.original.student_no || '-'}
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs">
          <span className="max-w-56 truncate">{row.original.email}</span>
          {row.original.is_foreigner_student ? (
            <DrsStatusBadge tone="neutral" className="px-1 text-[10px]">
              Foreigner
            </DrsStatusBadge>
          ) : null}
        </div>
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'current_stage',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Stage" />
    ),
    meta: { label: 'Stage' },
    cell: ({ row }) => (
      <span className="text-sm">{row.original.current_stage?.name ?? '-'}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    meta: { label: 'Status' },
    cell: ({ getValue }) => {
      const raw = String(getValue() ?? '');
      return (
        <DrsStatusBadge tone={toneForStatus(raw)}>
          {formatStatusLabel(raw)}
        </DrsStatusBadge>
      );
    },
    enableSorting: false,
  },
];

function StaffQueuePage() {
  const navigate = useNavigate();
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState(() => readStoredQueueStatus());
  const [statusHydrated, setStatusHydrated] = React.useState(false);
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch, status]);

  const stageAccessQuery = useQuery({
    queryKey: ['drs-employee-workflow-stage-access'],
    queryFn: fetchWorkflowStageAccess,
  });

  const stageSlugs = stageAccessQuery.data?.stageSlugs ?? [];

  React.useEffect(() => {
    if (!stageAccessQuery.isSuccess || statusHydrated) return;

    if (status !== '' && !stageSlugs.includes(status)) {
      setStatus('');
      writeStoredQueueStatus('');
    }
    setStatusHydrated(true);
  }, [stageAccessQuery.isSuccess, stageSlugs, status, statusHydrated]);

  const handleStatusChange = React.useCallback((value: string) => {
    const next = value === 'all' ? '' : value;
    setStatus(next);
    writeStoredQueueStatus(next);
  }, []);

  const query = useQuery({
    queryKey: ['drs-employee-queue', pagination, debouncedSearch, status],
    queryFn: () =>
      fetchEmployeeApplications({
        page: pagination.pageIndex + 1,
        perPage: Math.min(pagination.pageSize, 100),
        search: debouncedSearch,
        status,
      }),
    placeholderData: (prev) => prev,
  });

  const rows = query.data?.rows ?? [];
  const meta = query.data?.meta;
  const total = meta?.total ?? 0;
  const lastPage = meta?.last_page ?? 1;

  return (
    <DrsPageShell maxWidth="xl" contentClassName="space-y-5">
      <DrsPageHeader
        title="Workflow queue"
        description="Requests currently on — or previously through — your assigned stages. Select one to complete its tasks."
      />

      <div className="space-y-3 md:hidden">
        <DrsSearchField
          label="Search the queue"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, student no., or reference…"
        />
        <div>
          <Label htmlFor="queue-status-mobile" className="sr-only">
            Stage
          </Label>
          <Select value={status || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger id="queue-status-mobile" className="w-full">
              <SelectValue placeholder="All stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {stageSlugs.map((slug) => (
                <SelectItem key={slug} value={slug}>
                  {formatStatusLabel(slug)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {query.isLoading && rows.length === 0 ? (
          <DrsLoadingState label="Loading your queue…" />
        ) : query.isError ? (
          <DrsErrorState description="The queue could not be loaded. Check your connection and try again." />
        ) : rows.length === 0 ? (
          <DrsEmptyState
            title="Nothing waiting on you"
            description={
              status
                ? 'No requests are at this stage. Clear the stage filter to see the rest of your queue.'
                : 'Requests appear here once they reach a stage you are assigned to.'
            }
          />
        ) : (
          <ul className="divide-border/70 divide-y border-y">
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className="hover:bg-muted/40 focus-visible:ring-ring flex w-full items-center gap-3 py-3 text-left focus-visible:ring-2 focus-visible:outline-none"
                  onClick={() =>
                    void navigate({
                      to: '/staff/applications/$applicationId',
                      params: { applicationId: row.id },
                    })
                  }
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums">
                        #{displayApplicationRef(row)}
                      </span>
                      <DrsStatusBadge tone={toneForStatus(row.status)}>
                        {row.current_stage?.name ??
                          formatStatusLabel(row.status)}
                      </DrsStatusBadge>
                    </div>
                    <p className="text-muted-foreground truncate text-xs">
                      {row.student_name?.trim() || row.student_no || '—'}
                      {row.student_no && row.student_name?.trim()
                        ? ` · ${row.student_no}`
                        : ''}
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

        <p className="text-muted-foreground text-xs tabular-nums">
          {total} request{total === 1 ? '' : 's'} · page{' '}
          {meta?.current_page ?? 1} of {lastPage}
        </p>
      </div>

      <div className="hidden space-y-2 md:block">
        <DataTable<DRSApplicationRow>
          columns={columns}
          data={rows}
          getRowId={(row) => row.id}
          onRowClick={(row) =>
            void navigate({
              to: '/staff/applications/$applicationId',
              params: { applicationId: row.original.id },
            })
          }
          server={{
            pagination: {
              rowCount: total,
              state: pagination,
              onChange: setPagination,
              pageSizeOptions: [15, 30, 50, 100],
            },
            search: { value: search, onChange: setSearch },
          }}
          toolbar={{
            searchPlaceholder: 'Search name, student no., or reference…',
            slot: (
              <>
                <Label htmlFor="queue-status" className="sr-only">
                  Stage
                </Label>
                <Select
                  value={status || 'all'}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger id="queue-status" className="w-[190px]">
                    <SelectValue placeholder="All stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stages</SelectItem>
                    {stageSlugs.map((slug) => (
                      <SelectItem key={slug} value={slug}>
                        {formatStatusLabel(slug)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            ),
          }}
          status={{
            loading: query.isLoading || query.isFetching,
            error: query.isError,
            loadingMessage: 'Loading your queue…',
            errorMessage:
              'The queue could not be loaded. Check your connection and try again.',
            emptyMessage: status
              ? 'No requests are waiting at this stage. Clear the stage filter to see the rest of your queue.'
              : 'Nothing is waiting on you. Requests appear here once they reach a stage you are assigned to.',
          }}
        />

        <p className="text-muted-foreground text-xs tabular-nums">
          {total} request{total === 1 ? '' : 's'} · page{' '}
          {meta?.current_page ?? 1} of {lastPage}
          {query.isFetching ? ' · updating…' : ''}
        </p>
      </div>
    </DrsPageShell>
  );
}
