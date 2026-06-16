import { Button } from '@repo/ui/components/button';
import { Checkbox } from '@repo/ui/components/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import { toast } from '@repo/ui/exports';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { createWorkflowTransition } from '../-lib/api/workflow/createTransition.ts';
import type {
  WorkflowStage,
  WorkflowTransition,
} from '../-lib/api/workflow/types.ts';
import { updateWorkflowTransition } from '../-lib/api/workflow/updateTransition.ts';
import { sortedStages, sortedTasks } from './-utils.ts';

const NONE_VALUE = '__none__';

type Props = {
  open: boolean;
  stage: WorkflowStage | null;
  transition: WorkflowTransition | null;
  stages: WorkflowStage[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

const normalizeOutcomeKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');

export const TransitionDialog = ({
  open,
  stage,
  transition,
  stages,
  onOpenChange,
  onSaved,
}: Props) => {
  const [label, setLabel] = useState('');
  const [outcomeKey, setOutcomeKey] = useState('');
  const [toStageId, setToStageId] = useState('');
  const [triggerTaskId, setTriggerTaskId] = useState<string>(NONE_VALUE);
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  const targetStages = useMemo(
    () => sortedStages(stages).filter((item) => item.id !== stage?.id),
    [stage?.id, stages],
  );
  const triggerTasks = useMemo(() => sortedTasks(stage?.tasks), [stage?.tasks]);

  useEffect(() => {
    if (!open) return;
    setLabel(transition?.label ?? '');
    setOutcomeKey(transition?.outcome_key ?? '');
    setToStageId(transition?.to_stage_id ?? '');
    setTriggerTaskId(transition?.trigger_task_id ?? NONE_VALUE);
    setIsActive(transition?.is_active ?? true);
    setIsDefault(transition?.is_default ?? false);
  }, [open, transition]);

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createWorkflowTransition>[1]) => {
      if (!stage) throw new Error('Missing source stage');
      return createWorkflowTransition(stage.id, payload);
    },
  });
  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateWorkflowTransition>[1]) => {
      if (!transition) throw new Error('Missing transition');
      return updateWorkflowTransition(transition.id, payload);
    },
  });
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stage) return;

    const trimmedLabel = label.trim();
    const key = normalizeOutcomeKey(outcomeKey || trimmedLabel);
    if (!trimmedLabel || !key || !toStageId) {
      toast.error('Label, outcome key, and target stage are required.');
      return;
    }

    const payload = {
      label: trimmedLabel,
      outcome_key: key,
      to_stage_id: toStageId,
      trigger_task_id:
        triggerTaskId === NONE_VALUE || triggerTaskId === ''
          ? null
          : triggerTaskId,
      is_active: isActive,
      is_default: isDefault,
    };

    const callbacks = {
      onSuccess: () => {
        toast.success(transition ? 'Transition updated.' : 'Transition added.');
        onSaved();
      },
      onError: () => toast.error('Failed to save transition.'),
    };

    if (transition) {
      updateMutation.mutate(payload, callbacks);
    } else {
      createMutation.mutate(payload, callbacks);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {transition ? 'Edit transition' : 'Add transition'}
          </DialogTitle>
          <DialogDescription>
            Configure a manual branch from {stage?.name ?? 'this stage'} to a
            target stage.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="transition-label">Label</Label>
            <Input
              id="transition-label"
              className="mt-1"
              placeholder="e.g. Pickup handoff"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="transition-key">Outcome key</Label>
            <Input
              id="transition-key"
              className="mt-1"
              placeholder="pickup_handoff"
              value={outcomeKey}
              onChange={(event) => setOutcomeKey(event.target.value)}
            />
          </div>
          <div>
            <Label>Target stage</Label>
            <Select value={toStageId} onValueChange={setToStageId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select target stage" />
              </SelectTrigger>
              <SelectContent>
                {targetStages.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Trigger task</Label>
            <Select value={triggerTaskId} onValueChange={setTriggerTaskId}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Any completing task</SelectItem>
                {triggerTasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="transition-active"
              checked={isActive}
              onCheckedChange={(value) => setIsActive(value === true)}
            />
            <Label htmlFor="transition-active" className="font-normal">
              Active
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="transition-default"
              checked={isDefault}
              onCheckedChange={(value) => setIsDefault(value === true)}
            />
            <Label htmlFor="transition-default" className="font-normal">
              Default if no staff selection is provided
            </Label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {transition ? 'Save changes' : 'Add transition'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
