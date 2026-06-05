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
import { createWorkflowTask } from '../-lib/api/workflow/createTask.ts';
import type {
  WorkflowKind,
  WorkflowStage,
  WorkflowTask,
  WorkflowTaskKind,
} from '../-lib/api/workflow/types.ts';
import { updateWorkflowTask } from '../-lib/api/workflow/updateTask.ts';
import { ConfigField } from './-config-field.tsx';
import { type ClearanceOption, getClearanceLabel } from './-utils.ts';

type Props = {
  open: boolean;
  stage: WorkflowStage | null;
  task: WorkflowTask | null;
  kinds: WorkflowKind[];
  clearances: ClearanceOption[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export const TaskDialog = ({
  open,
  stage,
  task,
  kinds,
  clearances,
  onOpenChange,
  onSaved,
}: Props) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [kind, setKind] = useState<WorkflowTaskKind>('manual');
  const [isRequired, setIsRequired] = useState(true);
  const [parallelGroup, setParallelGroup] = useState('');
  const [clearanceId, setClearanceId] = useState<string>('');
  const [config, setConfig] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!open) return;
    setName(task?.name ?? '');
    setSlug(task?.slug ?? '');
    setKind((task?.kind as WorkflowTaskKind | undefined) ?? 'manual');
    setIsRequired(task ? Boolean(task.is_required) : true);
    setParallelGroup(task?.parallel_group ?? '');
    setClearanceId(task?.drs_clearance_id ?? '');
    setConfig(task?.config_json ?? {});
  }, [open, task]);

  const kindMeta = useMemo(
    () => kinds.find((k) => k.kind === kind),
    [kinds, kind],
  );

  const createMutation = useMutation({
    mutationFn: (vars: {
      stageId: number | string;
      payload: Parameters<typeof createWorkflowTask>[1];
    }) => createWorkflowTask(vars.stageId, vars.payload),
  });
  const updateMutation = useMutation({
    mutationFn: (vars: {
      taskId: number | string;
      payload: Parameters<typeof updateWorkflowTask>[1];
    }) => updateWorkflowTask(vars.taskId, vars.payload),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stage) return;

    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Task name is required.');
      return;
    }
    if (kindMeta?.requires_clearance && !clearanceId) {
      toast.error('Clearance is required for this task kind.');
      return;
    }

    const payload = {
      name: trimmed,
      slug: slug.trim() || undefined,
      kind,
      is_required: isRequired,
      parallel_group: parallelGroup.trim() || null,
      drs_clearance_id: kindMeta?.requires_clearance
        ? Number(clearanceId)
        : null,
      config_json: Object.keys(config).length > 0 ? config : null,
    };

    if (task) {
      updateMutation.mutate(
        { taskId: task.id, payload },
        {
          onSuccess: () => {
            toast.success('Task updated.');
            onSaved();
          },
          onError: () => toast.error('Failed to update task.'),
        },
      );
    } else {
      createMutation.mutate(
        { stageId: stage.id, payload },
        {
          onSuccess: () => {
            toast.success('Task created.');
            onSaved();
          },
          onError: () => toast.error('Failed to create task.'),
        },
      );
    }
  };

  const updateConfigField = (key: string, value: unknown) => {
    setConfig((prev) => {
      const next = { ...prev };
      if (value === '' || value === null || value === undefined) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {task
              ? `Edit task in ${stage?.name ?? ''}`
              : `Add task to ${stage?.name ?? ''}`}
          </DialogTitle>
          <DialogDescription>
            Tasks gate their stage. Use parallel groups to allow concurrent
            work.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="task-name">Name</Label>
            <Input
              id="task-name"
              className="mt-1"
              placeholder="e.g. Cashier validates payment"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="task-slug">Slug (optional)</Label>
            <Input
              id="task-slug"
              className="mt-1"
              placeholder="auto from name"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="task-kind">Kind</Label>
            <Select
              value={kind}
              onValueChange={(value) => setKind(value as WorkflowTaskKind)}
            >
              <SelectTrigger id="task-kind" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {kinds.map((k) => (
                  <SelectItem key={k.kind} value={k.kind}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {kindMeta ? (
              <p className="text-muted-foreground mt-1 text-xs">
                {kindMeta.description}
              </p>
            ) : null}
          </div>
          {kindMeta?.requires_clearance ? (
            <div>
              <Label htmlFor="task-clearance">Clearance department</Label>
              <Select
                value={clearanceId ? String(clearanceId) : ''}
                onValueChange={(value) => setClearanceId(value)}
              >
                <SelectTrigger id="task-clearance" className="mt-1">
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {clearances.map((dept) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {getClearanceLabel(dept)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div>
            <Label htmlFor="task-parallel">Parallel group (optional)</Label>
            <Input
              id="task-parallel"
              className="mt-1"
              placeholder="Tasks sharing this label may run concurrently"
              value={parallelGroup}
              onChange={(event) => setParallelGroup(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="task-required"
              checked={isRequired}
              onCheckedChange={(value) => setIsRequired(value === true)}
            />
            <Label
              htmlFor="task-required"
              className="cursor-pointer font-normal"
            >
              Required to advance this stage
            </Label>
          </div>

          {kindMeta && Object.keys(kindMeta.config_schema).length > 0 ? (
            <div className="border-border space-y-3 rounded-lg border p-3">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                {kindMeta.label} settings
              </p>
              {Object.entries(kindMeta.config_schema).map(
                ([fieldKey, schema]) => (
                  <ConfigField
                    key={fieldKey}
                    fieldKey={fieldKey}
                    schema={schema}
                    value={config[fieldKey]}
                    onChange={(value) => updateConfigField(fieldKey, value)}
                  />
                ),
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {task ? 'Save changes' : 'Create task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
