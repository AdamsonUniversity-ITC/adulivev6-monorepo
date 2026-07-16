import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { JSX, useMemo, useState } from 'react';
import { ConfirmActionDialog } from './-clearance/-confirm-action-dialog.tsx';
import { fetchClearanceDepartments } from './-lib/api/fetchClearanceDepartments.ts';
import { deleteWorkflowStage } from './-lib/api/workflow/deleteStage.ts';
import { deleteWorkflowTask } from './-lib/api/workflow/deleteTask.ts';
import { deleteWorkflowTransition } from './-lib/api/workflow/deleteTransition.ts';
import { fetchWorkflowStages } from './-lib/api/workflow/fetchStages.ts';
import { fetchWorkflowTaskKinds } from './-lib/api/workflow/fetchTaskKinds.ts';
import { reorderWorkflowStages } from './-lib/api/workflow/reorderStages.ts';
import { reorderWorkflowTasks } from './-lib/api/workflow/reorderTasks.ts';
import { reorderWorkflowTransitions } from './-lib/api/workflow/reorderTransitions.ts';
import type {
  WorkflowKind,
  WorkflowStage,
  WorkflowTask,
  WorkflowTransition,
} from './-lib/api/workflow/types.ts';
import {
  TASK_KIND_SLIDE_META,
  isTaskKindSlideKind,
} from './-task-kind-slides.ts';
import { StageCard } from './-workflow/-stage-card.tsx';
import { StageDialog } from './-workflow/-stage-dialog.tsx';
import { TaskDialog } from './-workflow/-task-dialog.tsx';
import { TaskKindAccessPanel } from './-workflow/-task-kind-access-panel.tsx';
import { TransitionDialog } from './-workflow/-transition-dialog.tsx';
import {
  CLEARANCES_QUERY_KEY,
  type ClearanceOption,
  KINDS_QUERY_KEY,
  STAGES_QUERY_KEY,
  moveItem,
  sortedStages,
  sortedTasks,
  sortedTransitions,
} from './-workflow/-utils.ts';

type StageDialogState = { open: boolean; stage: WorkflowStage | null };
type TaskDialogState = {
  open: boolean;
  stage: WorkflowStage | null;
  task: WorkflowTask | null;
};
type TransitionDialogState = {
  open: boolean;
  stage: WorkflowStage | null;
  transition: WorkflowTransition | null;
};

const unwrapClearances = (raw: unknown): ClearanceOption[] => {
  if (Array.isArray(raw)) return raw as ClearanceOption[];
  if (
    raw &&
    typeof raw === 'object' &&
    'data' in raw &&
    Array.isArray((raw as { data?: unknown }).data)
  ) {
    return (raw as { data: ClearanceOption[] }).data;
  }
  return [];
};

const StagesAndTasks = (): JSX.Element => {
  const queryClient = useQueryClient();

  const stagesQuery = useQuery({
    queryKey: STAGES_QUERY_KEY,
    queryFn: fetchWorkflowStages,
    refetchOnWindowFocus: false,
  });

  const kindsQuery = useQuery({
    queryKey: KINDS_QUERY_KEY,
    queryFn: fetchWorkflowTaskKinds,
    refetchOnWindowFocus: false,
  });

  const clearancesQuery = useQuery({
    queryKey: CLEARANCES_QUERY_KEY,
    queryFn: fetchClearanceDepartments,
    refetchOnWindowFocus: false,
  });

  const stages = useMemo(
    () => sortedStages(stagesQuery.data),
    [stagesQuery.data],
  );
  const kinds: WorkflowKind[] = kindsQuery.data ?? [];
  const clearances = useMemo(
    () => unwrapClearances(clearancesQuery.data),
    [clearancesQuery.data],
  );

  const invalidateStages = () =>
    queryClient.invalidateQueries({ queryKey: STAGES_QUERY_KEY });

  const reorderStagesMutation = useMutation({
    mutationFn: (orderedIds: Array<number | string>) =>
      reorderWorkflowStages(orderedIds),
  });
  const reorderTasksMutation = useMutation({
    mutationFn: ({
      stageId,
      orderedIds,
    }: {
      stageId: number | string;
      orderedIds: Array<number | string>;
    }) => reorderWorkflowTasks(stageId, orderedIds),
  });
  const deleteStageMutation = useMutation({
    mutationFn: (stageId: number | string) => deleteWorkflowStage(stageId),
  });
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: number | string) => deleteWorkflowTask(taskId),
  });
  const reorderTransitionsMutation = useMutation({
    mutationFn: ({
      stageId,
      orderedIds,
    }: {
      stageId: number | string;
      orderedIds: Array<number | string>;
    }) => reorderWorkflowTransitions(stageId, orderedIds),
  });
  const deleteTransitionMutation = useMutation({
    mutationFn: (transitionId: number | string) =>
      deleteWorkflowTransition(transitionId),
  });

  const [stageDialog, setStageDialog] = useState<StageDialogState>({
    open: false,
    stage: null,
  });
  const [taskDialog, setTaskDialog] = useState<TaskDialogState>({
    open: false,
    stage: null,
    task: null,
  });
  const [transitionDialog, setTransitionDialog] =
    useState<TransitionDialogState>({
      open: false,
      stage: null,
      transition: null,
    });
  const [pendingDeleteStage, setPendingDeleteStage] =
    useState<WorkflowStage | null>(null);
  const [pendingDeleteTask, setPendingDeleteTask] =
    useState<WorkflowTask | null>(null);
  const [pendingDeleteTransition, setPendingDeleteTransition] =
    useState<WorkflowTransition | null>(null);

  const handleReorderStage = (index: number, direction: -1 | 1) => {
    const reordered = moveItem(stages, index, index + direction);
    if (reordered === stages) return;

    queryClient.setQueryData<WorkflowStage[]>(STAGES_QUERY_KEY, reordered);

    reorderStagesMutation.mutate(
      reordered.map((s) => s.id),
      {
        onSuccess: () => {
          toast.success('Stage order updated.');
          invalidateStages();
        },
        onError: () => {
          toast.error('Failed to reorder stages.');
          invalidateStages();
        },
      },
    );
  };

  const handleReorderTask = (
    stage: WorkflowStage,
    index: number,
    direction: -1 | 1,
  ) => {
    const tasks = sortedTasks(stage.tasks);
    const reordered = moveItem(tasks, index, index + direction);
    if (reordered === tasks) return;

    reorderTasksMutation.mutate(
      { stageId: stage.id, orderedIds: reordered.map((t) => t.id) },
      {
        onSuccess: () => {
          toast.success('Task order updated.');
          invalidateStages();
        },
        onError: () => {
          toast.error('Failed to reorder tasks.');
        },
      },
    );
  };

  const handleReorderTransition = (
    stage: WorkflowStage,
    index: number,
    direction: -1 | 1,
  ) => {
    const transitions = sortedTransitions(stage.transitions);
    const reordered = moveItem(transitions, index, index + direction);
    if (reordered === transitions) return;

    reorderTransitionsMutation.mutate(
      { stageId: stage.id, orderedIds: reordered.map((t) => t.id) },
      {
        onSuccess: () => {
          toast.success('Transition order updated.');
          invalidateStages();
        },
        onError: () => toast.error('Failed to reorder transitions.'),
      },
    );
  };

  const confirmDeleteStage = () => {
    if (!pendingDeleteStage) return;
    deleteStageMutation.mutate(pendingDeleteStage.id, {
      onSuccess: () => {
        toast.success('Stage deleted.');
        setPendingDeleteStage(null);
        invalidateStages();
      },
      onError: () => toast.error('Failed to delete stage.'),
    });
  };

  const confirmDeleteTask = () => {
    if (!pendingDeleteTask) return;
    deleteTaskMutation.mutate(pendingDeleteTask.id, {
      onSuccess: () => {
        toast.success('Task deleted.');
        setPendingDeleteTask(null);
        invalidateStages();
      },
      onError: () => toast.error('Failed to delete task.'),
    });
  };

  const confirmDeleteTransition = () => {
    if (!pendingDeleteTransition) return;
    deleteTransitionMutation.mutate(pendingDeleteTransition.id, {
      onSuccess: () => {
        toast.success('Transition deleted.');
        setPendingDeleteTransition(null);
        invalidateStages();
      },
      onError: () => toast.error('Failed to delete transition.'),
    });
  };

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-foreground text-lg font-semibold">
            Application workflow stages
          </h2>
          <p className="text-muted-foreground text-sm">
            Reorder stages and add the tasks that gate each stage.
          </p>
        </div>
        <Button
          className="shrink-0 gap-2"
          onClick={() => setStageDialog({ open: true, stage: null })}
        >
          <Plus className="h-4 w-4" />
          Add stage
        </Button>
      </div>

      <div className="mt-4">
        {stagesQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading workflow…</p>
        ) : stagesQuery.isError ? (
          <p className="text-destructive text-sm">
            Could not load workflow. Try again.
          </p>
        ) : stages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-sm">
                No stages configured yet. Add one to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {stages.map((stage, index) => (
              <StageCard
                key={stage.id}
                stage={stage}
                index={index}
                total={stages.length}
                isStageDeleting={deleteStageMutation.isPending}
                isTaskDeleting={deleteTaskMutation.isPending}
                onMoveStage={(direction) =>
                  handleReorderStage(index, direction)
                }
                onEditStage={() => setStageDialog({ open: true, stage })}
                onDeleteStage={() => setPendingDeleteStage(stage)}
                onAddTask={() =>
                  setTaskDialog({ open: true, stage, task: null })
                }
                onMoveTask={(_, taskIndex, direction) =>
                  handleReorderTask(stage, taskIndex, direction)
                }
                onEditTask={(task) =>
                  setTaskDialog({ open: true, stage, task })
                }
                onDeleteTask={(task) => setPendingDeleteTask(task)}
                onAddTransition={() =>
                  setTransitionDialog({
                    open: true,
                    stage,
                    transition: null,
                  })
                }
                onMoveTransition={(_, transitionIndex, direction) =>
                  handleReorderTransition(stage, transitionIndex, direction)
                }
                onEditTransition={(transition) =>
                  setTransitionDialog({ open: true, stage, transition })
                }
                onDeleteTransition={(transition) =>
                  setPendingDeleteTransition(transition)
                }
              />
            ))}
            {kinds.length > 0 ? (
              <div className="border-muted/60 mt-10 space-y-4 border-t pt-8">
                <div>
                  <h3 className="text-foreground text-lg font-semibold">
                    Operator access by task kind
                  </h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Assign employees (by HR employee number) and auth roles for
                    each task kind. Clearance sign-off uses per-clearance users;
                    assessment, payment collection, and payment verification use
                    their own maintenance panels. Processing, compliance,
                    release, dispatch, handoff, and disposal also have dedicated
                    panels.
                  </p>
                </div>
                <div className="space-y-2">
                  {kinds.map((k) => {
                    if (k.kind === 'clearance_signoff') {
                      return (
                        <TaskKindAccessPanel
                          key={k.kind}
                          kind={k.kind}
                          title={k.label}
                          readOnly
                          readOnlyDescription="Configure operators on each clearance record."
                        />
                      );
                    }
                    if (k.kind === 'assessment') {
                      return (
                        <TaskKindAccessPanel
                          key={k.kind}
                          kind={k.kind}
                          title={k.label}
                          readOnly
                          readOnlyDescription="Use the Assessment panel to manage who may assess applications."
                        />
                      );
                    }
                    if (k.kind === 'payment_collection') {
                      return (
                        <TaskKindAccessPanel
                          key={k.kind}
                          kind={k.kind}
                          title={k.label}
                          readOnly
                          readOnlyDescription="Use the Payment collection panel to manage payment accounts and fees."
                        />
                      );
                    }
                    if (k.kind === 'payment_verification') {
                      return (
                        <TaskKindAccessPanel
                          key={k.kind}
                          kind={k.kind}
                          title={k.label}
                          readOnly
                          readOnlyDescription="Use the Payment verification panel to manage who may verify payments."
                        />
                      );
                    }
                    if (isTaskKindSlideKind(k.kind)) {
                      return (
                        <TaskKindAccessPanel
                          key={k.kind}
                          kind={k.kind}
                          title={k.label}
                          readOnly
                          readOnlyDescription={
                            TASK_KIND_SLIDE_META[k.kind].readOnlyDescription
                          }
                        />
                      );
                    }
                    return (
                      <TaskKindAccessPanel
                        key={k.kind}
                        kind={k.kind}
                        title={k.label}
                      />
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <StageDialog
        open={stageDialog.open}
        stage={stageDialog.stage}
        onOpenChange={(open) =>
          setStageDialog({ open, stage: open ? stageDialog.stage : null })
        }
        onSaved={() => {
          setStageDialog({ open: false, stage: null });
          invalidateStages();
        }}
      />

      <TaskDialog
        open={taskDialog.open}
        stage={taskDialog.stage}
        task={taskDialog.task}
        kinds={kinds}
        clearances={clearances}
        onOpenChange={(open) =>
          setTaskDialog((prev) => ({
            ...prev,
            open,
            stage: open ? prev.stage : null,
            task: open ? prev.task : null,
          }))
        }
        onSaved={() => {
          setTaskDialog({ open: false, stage: null, task: null });
          invalidateStages();
        }}
      />

      <TransitionDialog
        open={transitionDialog.open}
        stage={transitionDialog.stage}
        transition={transitionDialog.transition}
        stages={stages}
        onOpenChange={(open) =>
          setTransitionDialog((prev) => ({
            ...prev,
            open,
            stage: open ? prev.stage : null,
            transition: open ? prev.transition : null,
          }))
        }
        onSaved={() => {
          setTransitionDialog({ open: false, stage: null, transition: null });
          invalidateStages();
        }}
      />

      <ConfirmActionDialog
        open={pendingDeleteStage !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteStage(null);
        }}
        title="Delete stage?"
        description={
          pendingDeleteStage ? (
            <>
              <span className="font-medium">{pendingDeleteStage.name}</span> and
              all of its tasks will be removed. This cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete stage"
        pending={deleteStageMutation.isPending}
        onConfirm={confirmDeleteStage}
      />

      <ConfirmActionDialog
        open={pendingDeleteTask !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteTask(null);
        }}
        title="Delete task?"
        description={
          pendingDeleteTask ? (
            <>
              Remove the task{' '}
              <span className="font-medium">{pendingDeleteTask.name}</span>?
            </>
          ) : null
        }
        confirmLabel="Delete task"
        pending={deleteTaskMutation.isPending}
        onConfirm={confirmDeleteTask}
      />

      <ConfirmActionDialog
        open={pendingDeleteTransition !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteTransition(null);
        }}
        title="Delete transition?"
        description={
          pendingDeleteTransition ? (
            <>
              Remove the branch{' '}
              <span className="font-medium">
                {pendingDeleteTransition.label}
              </span>
              ?
            </>
          ) : null
        }
        confirmLabel="Delete transition"
        pending={deleteTransitionMutation.isPending}
        onConfirm={confirmDeleteTransition}
      />
    </>
  );
};

export const WorkflowSheet = (): JSX.Element => {
  return (
    <div className="bg-background min-h-screen p-4">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-foreground text-2xl font-bold">Workflow</h1>
          <p className="text-muted-foreground text-sm">
            Configure the DRS workflow stages, tasks, and task access rules.
          </p>
        </div>

        <StagesAndTasks />
      </div>
    </div>
  );
};
