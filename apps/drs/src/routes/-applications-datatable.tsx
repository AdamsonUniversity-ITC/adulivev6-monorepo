import { Badge } from '@repo/ui/components/badge';
import { DataTable } from '@repo/ui/custom/datatable/datatable';
import { DataTableColumnHeader } from '@repo/ui/custom/datatable/datatable-column-header';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import type {
  ColumnDef,
  PaginationState,
  SortingState,
} from '@tanstack/react-table';
import * as React from 'react';

import { fetchApplications } from './-lib/api/fetchApplications.ts';
import type { DRSApplicationRow as ApplicationRow } from './-lib/types/applications.ts';

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
  if (mode === 'pickup') return 'Pickup';
  if (mode === 'delivery') return 'Delivery';
  return 'Email';
}

/** Turn workflow slug / snake_case status into readable label. */
function formatApplicationStatus(raw: string | null | undefined): {
  label: string;
  empty: boolean;
} {
  const s = String(raw ?? '').trim();
  if (!s) return { label: '—', empty: true };

  const label = s
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => {
      if (!word.length) return '';
      const lower = word.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .filter(Boolean)
    .join(' ');

  return { label: label || s, empty: false };
}

const columns: ColumnDef<ApplicationRow>[] = [
  {
    accessorKey: 'student_no',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Student no." />
    ),
    meta: { label: 'Student no.' },
    cell: ({ getValue }) => {
      const v = getValue() as string;
      return (
        <span className="text-sm tabular-nums">{v.trim() ? v : '—'}</span>
      );
    },
  },
  {
    accessorKey: 'student_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    meta: { label: 'Name' },
    cell: ({ getValue }) => {
      const v = (getValue() as string | undefined) ?? '';
      const t = typeof v === 'string' ? v.trim() : '';
      return (
        <span className="max-w-56 truncate text-sm" title={t}>
          {t ? t : '—'}
        </span>
      );
    },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    meta: { label: 'Email' },
    cell: ({ getValue }) => {
      const v = getValue() as string;
      return (
        <span className="max-w-48 truncate text-sm" title={v}>
          {v}
        </span>
      );
    },
  },
  {
    accessorKey: 'school_year',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="School year" />
    ),
    meta: { label: 'School year' },
    cell: ({ getValue }) => {
      const v = getValue() as string;
      return v.trim() ? v : '—';
    },
  },
  {
    accessorKey: 'semester',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Semester" />
    ),
    meta: { label: 'Semester' },
    cell: ({ getValue }) => {
      const v = getValue() as string;
      return v.trim() ? v : '—';
    },
  },
  {
    accessorKey: 'receive_mode',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Receive" />
    ),
    meta: { label: 'Receive' },
    cell: ({ getValue }) => {
      const mode = getValue() as ApplicationRow['receive_mode'];
      return (
        <Badge variant="secondary" className="font-normal capitalize">
          {formatReceiveMode(mode)}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'is_paid',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Paid" />
    ),
    meta: { label: 'Paid' },
    cell: ({ getValue }) =>
      (getValue() as boolean) ? (
        <Badge className="font-normal">Paid</Badge>
      ) : (
        <Badge variant="outline" className="font-normal">
          Unpaid
        </Badge>
      ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    meta: { label: 'Status' },
    cell: ({ getValue }) => {
      const { label, empty } = formatApplicationStatus(
        getValue() as string | null | undefined,
      );
      if (empty) {
        return (
          <span className="text-muted-foreground text-sm">{label}</span>
        );
      }
      return (
        <Badge
          variant="secondary"
          className="max-w-48 whitespace-normal py-1 text-left font-normal leading-snug wrap-break-word"
          title={label}
        >
          {label}
        </Badge>
      );
    },
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

  return (
    <DataTable<ApplicationRow>
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
      onRowClick={(row) =>
        void navigate({
          to: '/applications/$applicationId',
          params: { applicationId: row.original.id },
        })
      }
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
        searchPlaceholder: 'Search documents, status, course, email…',
      }}
      status={{
        loading: isLoading || isFetching,
        error: isError,
        emptyMessage: 'No applications yet. Request a document from Apply.',
      }}
    />
  );
}
