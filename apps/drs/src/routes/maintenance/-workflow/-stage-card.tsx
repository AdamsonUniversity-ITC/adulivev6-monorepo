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
} from '../-lib/api/workflow/types.ts';
import { StageAccessPanel } from './-stage-access-panel.tsx';
import { TaskRow } from './-task-row.tsx';
import { sortedTasks } from './-utils.ts';

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
  onMoveTask: (task: WorkflowTask, taskIndex: number, direction: -1 | 1) => void;
  onEditTask: (task: WorkflowTask) => void;
  onDeleteTask: (task: WorkflowTask) => void;
};

const stageBorderClass = (stage: WorkflowStage): string | undefined => {
  if (stage.is_initial) return 'border-primary/60';
  if (stage.is_terminal) return 'border-emerald-500/60';
  return undefined;
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
}: Props) => {
  const tasks = sortedTasks(stage.tasks);

  return (
    <Card className={stageBorderClass(stage)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0 flex-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="bg-muted text-muted-foreground inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold">
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
          </CardTitle>
          <CardDescription className="mt-1 text-xs">
            slug <code>{stage.slug}</code> · transition{' '}
            <code>{stage.transition_rule}</code>
          </CardDescription>
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
            className="gap-2"
            onClick={onAddTask}
          >
            <Plus className="h-3 w-3" />
            Add task
          </Button>
        </div>
        <StageAccessPanel stage={stage} />
      </CardContent>
    </Card>
  );
};
