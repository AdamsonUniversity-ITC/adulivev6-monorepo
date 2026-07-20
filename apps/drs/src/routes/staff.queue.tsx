import {
  DrsMetricsStrip,
  DrsPageHeader,
  DrsPageShell,
  DrsSectionCard,
  DrsStatusBadge,
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
import { ClipboardList } from 'lucide-react';
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

const formatStatus = (raw: string) =>
  raw
    .trim()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

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
            <DrsStatusBadge tone="purple" className="px-2 py-0.5 text-[10px]">
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
          {formatStatus(raw)}
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
    <DrsPageShell maxWidth="xl" contentClassName="space-y-3">
      <DrsPageHeader
        backTo="/"
        backLabel="Home"
        eyebrow="Staff workspace"
        title="Workflow queue"
        description="Applications on — or previously through — your assigned stages."
      />

      <DrsMetricsStrip
        aria-label="Queue summary"
        items={[
          { label: 'Total', value: total },
          {
            label: 'Page',
            value: `${meta?.current_page ?? 1}/${lastPage}`,
          },
          {
            label: 'Sync',
            value: query.isFetching ? 'Syncing' : 'Current',
          },
        ]}
      />

      <DrsSectionCard
        title="Assigned applications"
        description="Select a request to complete stage tasks, remarks, payment, or dispatch."
        icon={ClipboardList}
      >
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
              <div className="flex items-center gap-2">
                <Label htmlFor="queue-status" className="sr-only">
                  Status
                </Label>
                <Select
                  value={status || 'all'}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger id="queue-status" className="w-[200px]">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {stageSlugs.map((slug) => (
                      <SelectItem key={slug} value={slug}>
                        {formatStatus(slug)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ),
          }}
          status={{
            loading: query.isLoading || query.isFetching,
            error: query.isError,
            loadingMessage: 'Loading your queue...',
            errorMessage: 'Could not load the queue.',
            emptyMessage: 'Nothing in your queue right now.',
          }}
          tableClassName="[&_thead_tr]:bg-muted/50"
        />
      </DrsSectionCard>
    </DrsPageShell>
  );
}
