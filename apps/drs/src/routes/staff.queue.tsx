import {
  isStudentOnlyDrsPortalUser,
} from '@/lib/drsPermissions.ts';
import { fetchAuthUser, normalizePermissions } from '@/lib/fetchAuthUser.ts';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import * as React from 'react';

import { LoadingIndicator } from './-loading-indicator.tsx';
import { fetchEmployeeApplications } from './-lib/api/fetchEmployeeApplications.ts';
import { displayApplicationRef } from './-lib/types/applications.ts';

export const Route = createFileRoute('/staff/queue')({
  beforeLoad: async () => {
    const { data } = await fetchAuthUser();
    const permissions = normalizePermissions(data);
    if (
      typeof window !== 'undefined' &&
      isStudentOnlyDrsPortalUser(permissions, window.location.hostname)
    ) {
      throw redirect({ to: '/' });
    }
  },
  component: StaffQueuePage,
});

function StaffQueuePage() {
  const [page, setPage] = React.useState(1);
  const perPage = 15;

  const query = useQuery({
    queryKey: ['drs-employee-queue', page, perPage],
    queryFn: () =>
      fetchEmployeeApplications({ page, perPage: Math.min(perPage, 100) }),
  });

  const rows = query.data?.rows ?? [];
  const meta = query.data?.meta;
  const lastPage =
    meta?.last_page ??
    Math.max(1, Math.ceil((meta?.total ?? 0) / (meta?.per_page ?? perPage)));

  const formatStatus = (raw: string) =>
    raw
      .trim()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="bg-background min-h-screen p-4">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1 px-2"
            asChild
          >
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Staff queue</CardTitle>
            <CardDescription>
              Applications in your workflow stage where you can complete at
              least one pending task.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {query.isLoading ? (
              <LoadingIndicator label="Loading your queue…" variant="block" />
            ) : query.isError ? (
              <p className="text-destructive text-sm">
                Could not load the queue.
              </p>
            ) : rows.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nothing in your queue right now.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right"> </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium tabular-nums">
                        #{displayApplicationRef(row)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[12rem] truncate text-sm font-medium">
                          {row.student_name?.trim()
                            ? row.student_name
                            : row.student_no || '—'}
                        </div>
                        <div className="text-muted-foreground truncate text-xs">
                          {row.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.current_stage?.name ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {formatStatus(row.status || '')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            params={{ applicationId: row.id }}
                            to="/staff/applications/$applicationId"
                          >
                            Open
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {!query.isLoading && meta && meta.total > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <p className="text-muted-foreground">
                  Showing page {meta.current_page} of {lastPage} · {meta.total}{' '}
                  total
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || query.isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= lastPage || query.isFetching}
                    onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
