import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs';
import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { JSX, useMemo, useState } from 'react';
import { ApplicationSheet } from './-application-sheet.tsx';
import { AssessmentSheet } from './-assessment-sheet.tsx';
import { ClearanceSheet } from './-clearance-sheet.tsx';
import { ConfirmActionDialog } from './-clearance/-confirm-action-dialog.tsx';
import { fetchClearanceDepartments } from './-lib/api/fetchClearanceDepartments.ts';
import { deleteWorkflowStage } from './-lib/api/workflow/deleteStage.ts';
import { deleteWorkflowTask } from './-lib/api/workflow/deleteTask.ts';
import { fetchWorkflowStages } from './-lib/api/workflow/fetchStages.ts';
import { fetchWorkflowTaskKinds } from './-lib/api/workflow/fetchTaskKinds.ts';
import { reorderWorkflowStages } from './-lib/api/workflow/reorderStages.ts';
import { reorderWorkflowTasks } from './-lib/api/workflow/reorderTasks.ts';
import type {
  WorkflowKind,
  WorkflowStage,
  WorkflowTask,
} from './-lib/api/workflow/types.ts';
import { StageCard } from './-workflow/-stage-card.tsx';
import { StageDialog } from './-workflow/-stage-dialog.tsx';
import { TaskDialog } from './-workflow/-task-dialog.tsx';
import {
  CLEARANCES_QUERY_KEY,
  type ClearanceOption,
  KINDS_QUERY_KEY,
  STAGES_QUERY_KEY,
  moveItem,
  sortedStages,
  sortedTasks,
} from './-workflow/-utils.ts';

type StageDialogState = { open: boolean; stage: WorkflowStage | null };
type TaskDialogState = {
  open: boolean;
  stage: WorkflowStage | null;
  task: WorkflowTask | null;
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

  const [stageDialog, setStageDialog] = useState<StageDialogState>({
    open: false,
    stage: null,
  });
  const [taskDialog, setTaskDialog] = useState<TaskDialogState>({
    open: false,
    stage: null,
    task: null,
  });
  const [pendingDeleteStage, setPendingDeleteStage] =
    useState<WorkflowStage | null>(null);
  const [pendingDeleteTask, setPendingDeleteTask] =
    useState<WorkflowTask | null>(null);

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
                onMoveStage={(direction) => handleReorderStage(index, direction)}
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
              />
            ))}
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
            Configure the full DRS application flow: catalog, clearance,
            assessment, and the workflow stages and tasks.
          </p>
        </div>

        <Tabs defaultValue="workflow">
          <TabsList className="w-full justify-start" variant="line">
            <TabsTrigger value="application">Application</TabsTrigger>
            <TabsTrigger value="clearance">Clearance</TabsTrigger>
            <TabsTrigger value="assessment">Assessment</TabsTrigger>
            <TabsTrigger value="workflow">Stages &amp; tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="application" className="mt-4">
            <ApplicationSheet />
          </TabsContent>
          <TabsContent value="clearance" className="mt-4">
            <ClearanceSheet />
          </TabsContent>
          <TabsContent value="assessment" className="mt-4">
            <AssessmentSheet />
          </TabsContent>
          <TabsContent value="workflow" className="mt-4">
            <StagesAndTasks />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
