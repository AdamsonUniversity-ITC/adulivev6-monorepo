import {
  DrsPageHeader,
  DrsPageShell,
  DrsSectionCard,
  DrsStatCard,
  DrsStatusBadge,
  toneForStatus,
} from '@/components/drs-ui.tsx';
import { Button } from '@repo/ui/components/button';
import { DataTable } from '@repo/ui/custom/datatable/datatable';
import { DataTableColumnHeader } from '@repo/ui/custom/datatable/datatable-column-header';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';
import { ClipboardList, FileClock, TimerReset } from 'lucide-react';
import * as React from 'react';

import { fetchEmployeeApplications } from './-lib/api/fetchEmployeeApplications.ts';
import { assertStaffPortalAccess } from './-lib/assertStaffPortalAccess.ts';
import {
  displayApplicationRef,
  type DRSApplicationRow,
} from './-lib/types/applications.ts';

export const Route = createFileRoute('/staff/queue')({
  beforeLoad: assertStaffPortalAccess,
  component: StaffQueuePage,
});

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
  {
    id: 'open',
    enableSorting: false,
    enableHiding: false,
    header: () => <span className="sr-only">Open</span>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="rounded-full" asChild>
          <Link
            params={{ applicationId: row.original.id }}
            to="/staff/applications/$applicationId"
          >
            Open
          </Link>
        </Button>
      </div>
    ),
  },
];

function StaffQueuePage() {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });

  const query = useQuery({
    queryKey: ['drs-employee-queue', pagination],
    queryFn: () =>
      fetchEmployeeApplications({
        page: pagination.pageIndex + 1,
        perPage: Math.min(pagination.pageSize, 100),
      }),
    placeholderData: (prev) => prev,
  });

  const rows = query.data?.rows ?? [];
  const meta = query.data?.meta;
  const total = meta?.total ?? 0;
  const lastPage = meta?.last_page ?? 1;

  return (
    <DrsPageShell maxWidth="xl" contentClassName="space-y-6">
      <DrsPageHeader
        backTo="/"
        backLabel="Home"
        eyebrow="Staff workspace"
        title="Workflow queue"
        description="Applications in your workflow stage where you can complete at least one pending task."
        badges={
          <>
            <DrsStatusBadge tone="warning">Action required</DrsStatusBadge>
            <DrsStatusBadge tone="info">
              Page {meta?.current_page ?? 1}
            </DrsStatusBadge>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-3" aria-label="Queue summary">
        <DrsStatCard
          label="Queued tasks"
          value={total}
          description="Applications currently visible to your account."
          icon={ClipboardList}
          tone="blue"
        />
        <DrsStatCard
          label="Current page"
          value={`${meta?.current_page ?? 1}/${lastPage}`}
          description="Use the table controls to move through your queue."
          icon={FileClock}
          tone="amber"
        />
        <DrsStatCard
          label="Refresh state"
          value={query.isFetching ? 'Syncing' : 'Current'}
          description="Queue data updates when pagination changes."
          icon={TimerReset}
          tone="emerald"
        />
      </section>

      <DrsSectionCard
        title="Assigned applications"
        description="Open a request to complete available stage tasks, save remarks, verify payment, or continue dispatch work."
        icon={ClipboardList}
      >
        <DataTable<DRSApplicationRow>
          columns={columns}
          data={rows}
          getRowId={(row) => row.id}
          server={{
            pagination: {
              rowCount: total,
              state: pagination,
              onChange: setPagination,
              pageSizeOptions: [15, 30, 50, 100],
            },
          }}
          toolbar={{ show: false }}
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
