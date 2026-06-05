import { Button } from '@repo/ui/components/button';
import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react';
import type { WorkflowTask } from '../-lib/api/workflow/types.ts';

type Props = {
  task: WorkflowTask;
  index: number;
  total: number;
  isDeleting: boolean;
  onMove: (direction: -1 | 1) => void;
  onEdit: () => void;
  onDelete: () => void;
};

export const TaskRow = ({
  task,
  index,
  total,
  isDeleting,
  onMove,
  onEdit,
  onDelete,
}: Props) => {
  return (
    <div className="bg-muted/40 border-border flex items-center justify-between gap-3 rounded-lg border p-2 text-sm">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{task.name}</span>
          <span className="text-muted-foreground text-xs">{task.kind}</span>
          {task.is_required ? null : (
            <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px]">
              optional
            </span>
          )}
          {task.parallel_group ? (
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-600">
              group: {task.parallel_group}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label="Move task up"
          onClick={() => onMove(-1)}
          disabled={index === 0}
        >
          <ArrowUp className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label="Move task down"
          onClick={() => onMove(1)}
          disabled={index === total - 1}
        >
          <ArrowDown className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label="Edit task"
          onClick={onEdit}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label="Delete task"
          onClick={onDelete}
          disabled={isDeleting}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
