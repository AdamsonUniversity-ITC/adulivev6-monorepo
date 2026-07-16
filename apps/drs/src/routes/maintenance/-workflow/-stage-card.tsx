import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { ArrowDown, ArrowUp, Flag, Pencil, Plus, Trash2 } from 'lucide-react';
import type {
  WorkflowStage,
  WorkflowTask,
  WorkflowTransition,
} from '../-lib/api/workflow/types.ts';
import { TaskRow } from './-task-row.tsx';
import { sortedTasks, sortedTransitions } from './-utils.ts';
import { WorkflowAssignmentSummary } from './-workflow-assignment-summary.tsx';

type Props = {
  stage: WorkflowStage;
  index: number;
  total: number;
  isStageDeleting: boolean;
  isTaskDeleting: boolean;
  onMoveStage: (direction: -1 | 1) => void;
  onEditStage: () => void;
  onDeleteStage: () => void;
  onAddTask: () => void;
  onMoveTask: (
    task: WorkflowTask,
    taskIndex: number,
    direction: -1 | 1,
  ) => void;
  onEditTask: (task: WorkflowTask) => void;
  onDeleteTask: (task: WorkflowTask) => void;
  onAddTransition: () => void;
  onMoveTransition: (
    transition: WorkflowTransition,
    transitionIndex: number,
    direction: -1 | 1,
  ) => void;
  onEditTransition: (transition: WorkflowTransition) => void;
  onDeleteTransition: (transition: WorkflowTransition) => void;
};

const stageBorderClass = (stage: WorkflowStage): string => {
  if (stage.is_initial) return 'drs-card border-primary/60';
  if (stage.is_terminal) return 'drs-card border-emerald-500/60';
  return 'drs-card';
};

export const StageCard = ({
  stage,
  index,
  total,
  isStageDeleting,
  isTaskDeleting,
  onMoveStage,
  onEditStage,
  onDeleteStage,
  onAddTask,
  onMoveTask,
  onEditTask,
  onDeleteTask,
  onAddTransition,
  onMoveTransition,
  onEditTransition,
  onDeleteTransition,
}: Props) => {
  const tasks = sortedTasks(stage.tasks);
  const transitions = sortedTransitions(stage.transitions);

  return (
    <Card className={stageBorderClass(stage)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0 flex-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="bg-primary/10 text-primary inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold">
              {index + 1}
            </span>
            {stage.name}
            {stage.is_initial ? (
              <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
                <Flag className="h-3 w-3" />
                initial
              </span>
            ) : null}
            {stage.is_terminal ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                terminal
              </span>
            ) : null}
            {stage.restrict_assigned_users_to_course_programs ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700">
                course scoped
              </span>
            ) : null}
            {stage.allows_owner_cancellation ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-700">
                owner cancel
              </span>
            ) : null}
          </CardTitle>
          <CardDescription className="mt-1 text-xs">
            slug <code>{stage.slug}</code> · transition{' '}
            <code>{stage.transition_rule}</code>
          </CardDescription>
          <div className="mt-2">
            <WorkflowAssignmentSummary
              target={{
                target_type: 'stage',
                stage_id: stage.id,
                label: stage.name,
              }}
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-label="Move stage up"
            onClick={() => onMoveStage(-1)}
            disabled={index === 0}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-label="Move stage down"
            onClick={() => onMoveStage(1)}
            disabled={index === total - 1}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-label="Edit stage"
            onClick={onEditStage}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-label="Delete stage"
            onClick={onDeleteStage}
            disabled={isStageDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            No tasks. The stage will auto-complete when entered.
          </p>
        ) : (
          tasks.map((task, taskIndex) => (
            <TaskRow
              key={task.id}
              task={task}
              index={taskIndex}
              total={tasks.length}
              isDeleting={isTaskDeleting}
              onMove={(direction) => onMoveTask(task, taskIndex, direction)}
              onEdit={() => onEditTask(task)}
              onDelete={() => onDeleteTask(task)}
            />
          ))
        )}
        <div className="pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 rounded-full"
            onClick={onAddTask}
          >
            <Plus className="h-3 w-3" />
            Add task
          </Button>
        </div>
        <div className="border-border mt-4 space-y-2 border-t pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">Transitions</p>
              <p className="text-muted-foreground text-xs">
                Manual next-step choices when this stage completes. Stage order
                remains the fallback when no transitions are configured.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={onAddTransition}
              disabled={stage.is_terminal}
            >
              <Plus className="h-3 w-3" />
              Add transition
            </Button>
          </div>
          {transitions.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              No branches configured.
            </p>
          ) : (
            transitions.map((transition, transitionIndex) => (
              <div
                key={transition.id}
                className="bg-muted/30 border-border flex items-center justify-between gap-3 rounded-2xl border p-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{transition.label}</span>
                    {transition.is_active ? null : (
                      <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px]">
                        inactive
                      </span>
                    )}
                    {transition.is_default ? (
                      <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-600">
                        default
                      </span>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground truncate text-xs">
                    When completing{' '}
                    {transition.trigger_task?.name ?? 'any task'}, staff can
                    choose <code>{transition.outcome_key}</code> -{'>'}{' '}
                    {transition.target_stage?.name ?? 'target stage'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label="Move transition up"
                    onClick={() =>
                      onMoveTransition(transition, transitionIndex, -1)
                    }
                    disabled={transitionIndex === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label="Move transition down"
                    onClick={() =>
                      onMoveTransition(transition, transitionIndex, 1)
                    }
                    disabled={transitionIndex === transitions.length - 1}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label="Edit transition"
                    onClick={() => onEditTransition(transition)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label="Delete transition"
                    onClick={() => onDeleteTransition(transition)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
