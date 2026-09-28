import { DrsInlineLoading } from '@/components/drs-ui.tsx';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ConfirmActionDialog } from '../-clearance/-confirm-action-dialog.tsx';
import { fetchAutoFetchConfigs } from '../-lib/api/workflow/fetchAutoFetchConfigs.ts';
import { deleteAutoFetchConfig } from '../-lib/api/workflow/mutateAutoFetchConfigs.ts';
import type {
  AutoFetchConfig,
  WorkflowKind,
  WorkflowStage,
} from '../-lib/api/workflow/types.ts';
import { AutoFetchDialog } from './-auto-fetch-dialog.tsx';
import { AUTO_FETCH_CONFIGS_QUERY_KEY } from './-utils.ts';

type Props = {
  stages: WorkflowStage[];
  kinds: WorkflowKind[];
};

const targetLabel = (
  config: AutoFetchConfig,
  kinds: WorkflowKind[],
): string => {
  if (config.target_type === 'stage') {
    return config.stage_name ?? `Stage #${config.drs_workflow_stage_id}`;
  }
  const kind = kinds.find((k) => k.kind === config.task_kind);
  return kind?.label ?? config.task_kind ?? 'Task kind';
};

export const AutoFetchPanel = ({ stages, kinds }: Props) => {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<{
    open: boolean;
    config: AutoFetchConfig | null;
  }>({ open: false, config: null });
  const [pendingDelete, setPendingDelete] = useState<AutoFetchConfig | null>(
    null,
  );

  const configsQuery = useQuery({
    queryKey: AUTO_FETCH_CONFIGS_QUERY_KEY,
    queryFn: () => fetchAutoFetchConfigs(),
    refetchOnWindowFocus: false,
  });

  const configs = useMemo(() => configsQuery.data ?? [], [configsQuery.data]);

  const deleteMutation = useMutation({
    mutationFn: (configId: string) => deleteAutoFetchConfig(configId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: AUTO_FETCH_CONFIGS_QUERY_KEY });

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-foreground text-lg font-semibold">Auto fetch</h2>
          <p className="text-muted-foreground text-sm">
            Daily fetch of a student data source for applications in a stage or
            task kind. Matching rules color the row or add a shared flag.
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
        <DrsInlineLoading label="Loading auto-fetch rules…" />
      ) : configs.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No auto-fetch rules configured yet.
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
                  {targetLabel(config, kinds)} · Source{' '}
                  {config.source.replaceAll('_', ' ')} · Action{' '}
                  {config.action.replaceAll('_', ' ')} · Daily at{' '}
                  {config.run_at_time}
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

      <AutoFetchDialog
        open={dialog.open}
        config={dialog.config}
        stages={stages}
        kinds={kinds}
        onOpenChange={(open) =>
          setDialog((prev) => ({
            ...prev,
            open,
            config: open ? prev.config : null,
          }))
        }
        onSaved={invalidate}
      />

      <ConfirmActionDialog
        open={pendingDelete !== null}
        title="Delete auto-fetch rule?"
        description={
          pendingDelete
            ? `Remove “${pendingDelete.name}”? Stored queue tags for this rule will also be deleted.`
            : ''
        }
        confirmLabel="Delete"
        pending={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await deleteMutation.mutateAsync(pendingDelete.id);
            toast.success('Auto-fetch rule deleted.');
            setPendingDelete(null);
            invalidate();
          } catch {
            toast.error('Failed to delete auto-fetch rule.');
          }
        }}
      />
    </div>
  );
};
