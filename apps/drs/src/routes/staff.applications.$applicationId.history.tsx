import {
  DrsEmptyState,
  DrsErrorState,
  DrsLoadingState,
  DrsNotFoundState,
  DrsPageHeader,
  DrsPageShell,
  DrsSectionCard,
  DrsStatusBadge,
  formatStatusLabel,
  toneForStatus,
} from '@/components/drs-ui.tsx';
import { hasDrAdminAccessForHost } from '@/lib/drsPermissions.ts';
import { fetchAuthUser, normalizePermissions } from '@/lib/fetchAuthUser.ts';
import { isNotFoundError } from '@/lib/isNotFoundError.ts';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@repo/ui/components/alert-dialog';
import { Button } from '@repo/ui/components/button';
import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import * as React from 'react';

import { fetchApplicationHistory } from './-lib/api/fetchApplicationHistory.ts';
import { postRestoreApplicationHistory } from './-lib/api/postRestoreApplicationHistory.ts';
import { assertStaffPortalAccess } from './-lib/assertStaffPortalAccess.ts';
import type {
  DRSApplicationHistoryRow,
  DRSApplicationHistorySummary,
} from './-lib/types/history.ts';

export const Route = createFileRoute(
  '/staff/applications/$applicationId/history',
)({
  beforeLoad: assertStaffPortalAccess,
  loader: async () => {
    const { data } = await fetchAuthUser();
    const permissions = normalizePermissions(data);
    return {
      canRestore:
        typeof window !== 'undefined' &&
        hasDrAdminAccessForHost(permissions, window.location.hostname),
    };
  },
  component: ApplicationHistoryPage,
});

function formatDate(value: string | null): string {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatEvent(value: string | null): string {
  return formatStatusLabel(value || 'changed');
}

function summarize(summary: DRSApplicationHistorySummary): string[] {
  if (summary.created === true) {
    return ['Initial application snapshot recorded.'];
  }
  if (summary.no_changes === true) {
    return ['No tracked fields changed.'];
  }

  const lines: string[] = [];
  for (const [section, value] of Object.entries(summary)) {
    if (typeof value === 'boolean') continue;
    const label = section.replace(/^application_/, '').replace(/_/g, ' ');
    const parts: string[] = [];
    if (value.changed?.length) {
      parts.push(`changed ${value.changed.join(', ')}`);
    }
    if (value.added) parts.push(`added ${value.added}`);
    if (value.updated) parts.push(`updated ${value.updated}`);
    if (value.removed) parts.push(`removed ${value.removed}`);
    if (parts.length) lines.push(`${label}: ${parts.join('; ')}`);
  }

  return lines.length ? lines : ['No summary available.'];
}

function HistoryCard({
  row,
  canRestore,
  isLatest,
  onRestore,
  isRestoring,
}: {
  row: DRSApplicationHistoryRow;
  canRestore: boolean;
  isLatest: boolean;
  onRestore: (historyId: string) => void;
  isRestoring: boolean;
}) {
  const lines = summarize(row.summary);
  const restoreEnabled = canRestore && row.can_restore && !isLatest;
  const restoreTitle = isLatest ? 'This is the current version.' : undefined;

  return (
    <DrsSectionCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold">
            Version {row.version}
            <DrsStatusBadge tone={toneForStatus(row.event)}>
              {formatEvent(row.event)}
            </DrsStatusBadge>
            {isLatest ? (
              <DrsStatusBadge tone="success">Current</DrsStatusBadge>
            ) : null}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {row.description} · {formatDate(row.created_at)}
          </p>
        </div>

        {canRestore ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!restoreEnabled || isRestoring}
                className="gap-1"
                title={restoreTitle}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Rollback
              </Button>
            </AlertDialogTrigger>
            {restoreEnabled ? (
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Restore version {row.version}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will replace the application runtime state with the
                    selected snapshot. Messages will not be changed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onRestore(row.id)}>
                    Rollback to version
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            ) : null}
          </AlertDialog>
        ) : null}
      </div>
      <div className="mt-4 space-y-4 text-sm">
        <div className="bg-muted/20 grid gap-2 rounded-2xl border p-3 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-xs">Status</p>
            <p className="font-medium">
              {formatStatusLabel(row.snapshot_meta.status ?? 'unknown')}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Snapshot updated</p>
            <p className="font-medium">
              {formatDate(row.snapshot_meta.updated_at)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Runtime rows</p>
            <p className="font-medium">
              {row.snapshot_meta.documents_count} lines,{' '}
              {row.snapshot_meta.clearances_count} clearances
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Workflow rows</p>
            <p className="font-medium">
              {row.snapshot_meta.stage_runs_count} stages,{' '}
              {row.snapshot_meta.tasks_count} tasks
            </p>
          </div>
        </div>

        <div>
          <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
            Changes
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>
    </DrsSectionCard>
  );
}

export function ApplicationHistoryContent({
  applicationId,
  canRestore,
  backTo,
}: {
  applicationId: string;
  canRestore: boolean;
  backTo: 'staff' | 'student';
}) {
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const perPage = 10;

  const query = useQuery({
    queryKey: ['drs-application-history', applicationId, page, perPage],
    queryFn: () =>
      fetchApplicationHistory({
        applicationId,
        page,
        perPage,
      }),
  });

  const restoreMutation = useMutation({
    mutationFn: (historyId: string) =>
      postRestoreApplicationHistory({ applicationId, historyId }),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        ['drs-employee-application', applicationId],
        updated,
      );
      void queryClient.invalidateQueries({
        queryKey: ['drs-application-history', applicationId],
      });
      void queryClient.invalidateQueries({ queryKey: ['drs-employee-queue'] });
      toast.success('Application restored.');
    },
    onError: () => {
      toast.error('Could not restore application.');
    },
  });

  const rows = query.data?.rows ?? [];
  const meta = query.data?.meta;
  const latestVersion = rows.reduce(
    (max, row) => Math.max(max, row.version),
    0,
  );

  return (
    <DrsPageShell maxWidth="lg" contentClassName="space-y-3">
      <DrsPageHeader
        eyebrow="Audit trail"
        title="Edit history"
        description="Review recorded application versions and restore an earlier runtime snapshot. Messages are excluded from rollback."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1 rounded-full"
            asChild
          >
            {backTo === 'staff' ? (
              <Link
                to="/staff/applications/$applicationId"
                params={{ applicationId }}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Application
              </Link>
            ) : (
              <Link
                to="/applications/$applicationId"
                params={{ applicationId }}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Application
              </Link>
            )}
          </Button>
        }
        badges={
          <>
            <DrsStatusBadge tone={canRestore ? 'warning' : 'neutral'}>
              {canRestore ? 'Rollback available' : 'Read-only'}
            </DrsStatusBadge>
            <DrsStatusBadge tone="info">Versioned snapshots</DrsStatusBadge>
          </>
        }
      />

      {query.isLoading ? (
        <DrsLoadingState label="Loading history…" />
      ) : isNotFoundError(query.error) ? (
        <DrsNotFoundState
          title="Request not found"
          description="This application ID may be incorrect, or the request may have been removed."
          action={
            <Button
              variant="outline"
              asChild
              size="sm"
              className="rounded-full"
            >
              <Link to={backTo === 'staff' ? '/staff/queue' : '/'}>
                {backTo === 'staff' ? 'Back to queue' : 'Back to applications'}
              </Link>
            </Button>
          }
        />
      ) : query.isError ? (
        <DrsErrorState
          title="Could not load edit history"
          description="Please retry after a moment."
        />
      ) : rows.length === 0 ? (
        <DrsEmptyState
          title="No history yet"
          description="No audit history has been recorded for this application yet."
        />
      ) : (
        rows.map((row) => (
          <HistoryCard
            key={row.id}
            row={row}
            canRestore={canRestore}
            isLatest={row.version === latestVersion && page === 1}
            isRestoring={restoreMutation.isPending}
            onRestore={(historyId) => restoreMutation.mutate(historyId)}
          />
        ))
      )}

      {meta && meta.total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-muted-foreground">
            Showing page {meta.current_page} of {meta.last_page} · {meta.total}{' '}
            versions
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
              disabled={page >= meta.last_page || query.isFetching}
              onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </DrsPageShell>
  );
}

function ApplicationHistoryPage() {
  const { applicationId } = Route.useParams();
  const { canRestore } = Route.useLoaderData();

  return (
    <ApplicationHistoryContent
      applicationId={applicationId}
      canRestore={canRestore}
      backTo="staff"
    />
  );
}
