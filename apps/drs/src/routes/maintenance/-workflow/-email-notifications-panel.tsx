import { DrsInlineLoading } from '@/components/drs-ui.tsx';
import { Button } from '@repo/ui/components/button';
import { Badge } from '@repo/ui/components/badge';
import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ConfirmActionDialog } from '../-clearance/-confirm-action-dialog.tsx';
import { fetchEmailNotificationConfigs } from '../-lib/api/workflow/fetchEmailNotifications.ts';
import { deleteEmailNotificationConfig } from '../-lib/api/workflow/mutateEmailNotifications.ts';
import type {
  EmailNotificationConfig,
  WorkflowKind,
  WorkflowStage,
} from '../-lib/api/workflow/types.ts';
import { EmailNotificationDialog } from './-email-notification-dialog.tsx';
import { EMAIL_NOTIFICATIONS_QUERY_KEY } from './-utils.ts';

type Props = {
  stages: WorkflowStage[];
  kinds: WorkflowKind[];
};

const conditionLabel = (condition: EmailNotificationConfig['condition']) =>
  condition === 'into' ? 'Into' : 'Out of';

const targetLabel = (
  config: EmailNotificationConfig,
  kinds: WorkflowKind[],
): string => {
  if (config.target_type === 'stage') {
    return config.stage_name ?? `Stage #${config.drs_workflow_stage_id}`;
  }
  const kind = kinds.find((k) => k.kind === config.task_kind);
  return kind?.label ?? config.task_kind ?? 'Task kind';
};

export const EmailNotificationsPanel = ({ stages, kinds }: Props) => {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<{
    open: boolean;
    config: EmailNotificationConfig | null;
  }>({ open: false, config: null });
  const [pendingDelete, setPendingDelete] =
    useState<EmailNotificationConfig | null>(null);

  const configsQuery = useQuery({
    queryKey: EMAIL_NOTIFICATIONS_QUERY_KEY,
    queryFn: () => fetchEmailNotificationConfigs(),
    refetchOnWindowFocus: false,
  });

  const configs = useMemo(
    () => configsQuery.data ?? [],
    [configsQuery.data],
  );

  const deleteMutation = useMutation({
    mutationFn: (configId: string) => deleteEmailNotificationConfig(configId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: EMAIL_NOTIFICATIONS_QUERY_KEY });

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-foreground text-lg font-semibold">
            Email notifications
          </h2>
          <p className="text-muted-foreground text-sm">
            Configurable emails attached to stages or task kinds (into / out
            of).
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => setDialog({ open: true, config: null })}
        >
          <Plus className="size-4" />
          Add notification
        </Button>
      </div>

      {configsQuery.isLoading ? (
        <DrsInlineLoading label="Loading email notifications…" />
      ) : configs.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No email notifications configured yet.
        </p>
      ) : (
        <ul className="divide-border border-border divide-y rounded-md border">
          {configs.map((config) => (
            <li
              key={config.id}
              className="flex items-start justify-between gap-3 px-3 py-3"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-foreground font-medium">
                    {config.name}
                  </span>
                  {!config.is_enabled ? (
                    <Badge variant="secondary">Disabled</Badge>
                  ) : null}
                </div>
                <p className="text-muted-foreground text-xs">
                  {config.target_type === 'stage' ? 'Stage' : 'Task kind'}:{' '}
                  {targetLabel(config, kinds)} · {conditionLabel(config.condition)}
                  {' · '}
                  {[
                    config.notify_student ? 'Student' : null,
                    config.notify_staff ? 'Staff' : null,
                  ]
                    .filter(Boolean)
                    .join(', ') || 'No recipients'}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {config.subject}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setDialog({ open: true, config })}
                  aria-label={`Edit ${config.name}`}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setPendingDelete(config)}
                  aria-label={`Delete ${config.name}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <EmailNotificationDialog
        open={dialog.open}
        config={dialog.config}
        stages={stages}
        kinds={kinds}
        onOpenChange={(open) =>
          setDialog({ open, config: open ? dialog.config : null })
        }
        onSaved={() => {
          setDialog({ open: false, config: null });
          invalidate();
        }}
      />

      <ConfirmActionDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete email notification?"
        description={
          pendingDelete ? (
            <>
              Remove{' '}
              <span className="font-medium">{pendingDelete.name}</span>? This
              cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete"
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteMutation.mutate(pendingDelete.id, {
            onSuccess: () => {
              toast.success('Email notification deleted.');
              setPendingDelete(null);
              invalidate();
            },
            onError: () => toast.error('Failed to delete email notification.'),
          });
        }}
      />
    </div>
  );
};
