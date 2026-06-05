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
import { useEffect, useState } from 'react';
import { createWorkflowStage } from '../-lib/api/workflow/createStage.ts';
import type { WorkflowStage } from '../-lib/api/workflow/types.ts';
import { updateWorkflowStage } from '../-lib/api/workflow/updateStage.ts';

type TransitionRule = WorkflowStage['transition_rule'];

type Props = {
  open: boolean;
  stage: WorkflowStage | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export const StageDialog = ({ open, stage, onOpenChange, onSaved }: Props) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isInitial, setIsInitial] = useState(false);
  const [isTerminal, setIsTerminal] = useState(false);
  const [transitionRule, setTransitionRule] =
    useState<TransitionRule>('all_required_done');

  useEffect(() => {
    if (!open) return;
    setName(stage?.name ?? '');
    setSlug(stage?.slug ?? '');
    setIsInitial(Boolean(stage?.is_initial));
    setIsTerminal(Boolean(stage?.is_terminal));
    setTransitionRule(stage?.transition_rule ?? 'all_required_done');
  }, [open, stage]);

  const createMutation = useMutation({ mutationFn: createWorkflowStage });
  const updateMutation = useMutation({
    mutationFn: (vars: {
      stageId: number | string;
      payload: Parameters<typeof updateWorkflowStage>[1];
    }) => updateWorkflowStage(vars.stageId, vars.payload),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Stage name is required.');
      return;
    }

    if (isInitial && isTerminal) {
      toast.error('A stage cannot be both initial and terminal.');
      return;
    }

    const payload = {
      name: trimmed,
      slug: slug.trim() || undefined,
      is_initial: isInitial,
      is_terminal: isTerminal,
      transition_rule: transitionRule,
    };

    if (stage) {
      updateMutation.mutate(
        { stageId: stage.id, payload },
        {
          onSuccess: () => {
            toast.success('Stage updated.');
            onSaved();
          },
          onError: () => toast.error('Failed to update stage.'),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Stage created.');
          onSaved();
        },
        onError: () => toast.error('Failed to create stage.'),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{stage ? 'Edit stage' : 'New stage'}</DialogTitle>
          <DialogDescription>
            Stages run in order. Mark exactly one stage as initial and at most
            one as terminal.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="stage-name">Name</Label>
            <Input
              id="stage-name"
              className="mt-1"
              placeholder="e.g. For Assessment"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="stage-slug">Slug (optional)</Label>
            <Input
              id="stage-slug"
              className="mt-1"
              placeholder="auto from name"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="stage-rule">Transition rule</Label>
            <Select
              value={transitionRule}
              onValueChange={(value) =>
                setTransitionRule(value as TransitionRule)
              }
            >
              <SelectTrigger id="stage-rule" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_required_done">
                  All required tasks must complete
                </SelectItem>
                <SelectItem value="any_done">Any task completes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="stage-initial"
              checked={isInitial}
              onCheckedChange={(value) => setIsInitial(value === true)}
            />
            <Label
              htmlFor="stage-initial"
              className="cursor-pointer font-normal"
            >
              Initial stage
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="stage-terminal"
              checked={isTerminal}
              onCheckedChange={(value) => setIsTerminal(value === true)}
            />
            <Label
              htmlFor="stage-terminal"
              className="cursor-pointer font-normal"
            >
              Terminal stage (application is finalised here)
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
              {stage ? 'Save changes' : 'Create stage'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
