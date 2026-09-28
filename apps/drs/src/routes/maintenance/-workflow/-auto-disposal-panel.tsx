import { DrsInlineLoading } from '@/components/drs-ui.tsx';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ConfirmActionDialog } from '../-clearance/-confirm-action-dialog.tsx';
import { fetchAutoDisposalConfigs } from '../-lib/api/workflow/fetchAutoDisposalConfigs.ts';
import { deleteAutoDisposalConfig } from '../-lib/api/workflow/mutateAutoDisposalConfigs.ts';
import type {
  AutoDisposalConfig,
  WorkflowKind,
  WorkflowStage,
} from '../-lib/api/workflow/types.ts';
import { AutoDisposalDialog } from './-auto-disposal-dialog.tsx';
import { AUTO_DISPOSAL_CONFIGS_QUERY_KEY } from './-utils.ts';

type Props = {
  stages: WorkflowStage[];
  kinds: WorkflowKind[];
};

const targetLabel = (
  config: AutoDisposalConfig,
  kinds: WorkflowKind[],
): string => {
  if (config.target_type === 'stage') {
    return config.stage_name ?? `Stage #${config.drs_workflow_stage_id}`;
  }
  const kind = kinds.find((k) => k.kind === config.task_kind);
  return kind?.label ?? config.task_kind ?? 'Task kind';
};

export const AutoDisposalPanel = ({ stages, kinds }: Props) => {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<{
    open: boolean;
    config: AutoDisposalConfig | null;
  }>({ open: false, config: null });
  const [pendingDelete, setPendingDelete] =
    useState<AutoDisposalConfig | null>(null);

  const configsQuery = useQuery({
    queryKey: AUTO_DISPOSAL_CONFIGS_QUERY_KEY,
    queryFn: () => fetchAutoDisposalConfigs(),
    refetchOnWindowFocus: false,
  });

  const configs = useMemo(() => configsQuery.data ?? [], [configsQuery.data]);

  const deleteMutation = useMutation({
    mutationFn: (configId: string) => deleteAutoDisposalConfig(configId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: AUTO_DISPOSAL_CONFIGS_QUERY_KEY });

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-foreground text-lg font-semibold">
            Auto disposal
          </h2>
          <p className="text-muted-foreground text-sm">
            Dispose unclaimed requests after working days since a stage or task
            kind was entered. Optionally email the student beforehand.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => setDialog({ open: true, config: null })}
        >
          <Plus className="size-4" />
          Add rule
        </Button>
      </div>

      {configsQuery.isLoading ? (
        <DrsInlineLoading label="Loading auto disposal rules…" />
      ) : configs.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No auto disposal rules configured yet.
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
                  {targetLabel(config, kinds)} · Dispose after{' '}
                  {config.dispose_after_working_days} working day
                  {config.dispose_after_working_days === 1 ? '' : 's'}
                  {config.notify_before_working_days > 0
                    ? ` · Warn student ${config.notify_before_working_days} working day${config.notify_before_working_days === 1 ? '' : 's'} before`
                    : ' · No warning email'}
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

      <AutoDisposalDialog
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
        title="Delete auto disposal rule?"
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
              toast.success('Auto disposal rule deleted.');
              setPendingDelete(null);
              invalidate();
            },
            onError: () => toast.error('Failed to delete auto disposal rule.'),
          });
        }}
      />
    </div>
  );
};
