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
  RichTextEditor,
  sanitizeRichTextHtml,
} from '@repo/ui/components/rich-text-editor';
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
import {
  createAutoDisposalConfig,
  updateAutoDisposalConfig,
  type AutoDisposalPayload,
} from '../-lib/api/workflow/mutateAutoDisposalConfigs.ts';
import type {
  AutoDisposalConfig,
  AutoDisposalTargetType,
  WorkflowKind,
  WorkflowStage,
  WorkflowTaskKind,
} from '../-lib/api/workflow/types.ts';
import { MergeTokenLegend } from './-merge-token-legend.tsx';
import {
  applyMergeTokens,
  AUTO_DISPOSAL_SAMPLE_TOKEN_VALUES,
} from './-merge-tokens.ts';

const DEFAULT_BODY = [
  '<p>Hello,</p>',
  '<p>Your document request <strong>#{{drs_no}}</strong> will be disposed soon if it remains unclaimed.</p>',
  '<p>Current status: <strong>{{status}}</strong>.</p>',
  '<p>Please complete any remaining steps in the Document Request System.</p>',
  '<p>Thank you.</p>',
].join('');

type Props = {
  open: boolean;
  config: AutoDisposalConfig | null;
  stages: WorkflowStage[];
  kinds: WorkflowKind[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export const AutoDisposalDialog = ({
  open,
  config,
  stages,
  kinds,
  onOpenChange,
  onSaved,
}: Props) => {
  const [name, setName] = useState('');
  const [targetType, setTargetType] =
    useState<AutoDisposalTargetType>('task_kind');
  const [stageId, setStageId] = useState('');
  const [taskKind, setTaskKind] = useState<WorkflowTaskKind | ''>('');
  const [disposeAfter, setDisposeAfter] = useState('90');
  const [notifyBefore, setNotifyBefore] = useState('0');
  const [subject, setSubject] = useState(
    'DRS request will be disposed: {{drs_no}}',
  );
  const [bodyHtml, setBodyHtml] = useState(DEFAULT_BODY);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    if (!open) return;
    setName(config?.name ?? '');
    setTargetType(config?.target_type ?? 'task_kind');
    setStageId(config?.drs_workflow_stage_id ?? '');
    setTaskKind(config?.task_kind ?? '');
    setDisposeAfter(String(config?.dispose_after_working_days ?? 90));
    setNotifyBefore(String(config?.notify_before_working_days ?? 0));
    setSubject(
      config?.subject || 'DRS request will be disposed: {{drs_no}}',
    );
    setBodyHtml(config?.body_html || DEFAULT_BODY);
    setIsEnabled(config?.is_enabled ?? true);
  }, [open, config]);

  const notifyDays = Number.parseInt(notifyBefore, 10) || 0;
  const showEmailFields = notifyDays > 0;

  const previewSubject = useMemo(
    () => applyMergeTokens(subject, AUTO_DISPOSAL_SAMPLE_TOKEN_VALUES),
    [subject],
  );
  const previewBody = useMemo(
    () =>
      sanitizeRichTextHtml(
        applyMergeTokens(bodyHtml, AUTO_DISPOSAL_SAMPLE_TOKEN_VALUES),
      ),
    [bodyHtml],
  );

  const createMutation = useMutation({ mutationFn: createAutoDisposalConfig });
  const updateMutation = useMutation({
    mutationFn: (vars: {
      configId: string | number;
      payload: Partial<AutoDisposalPayload>;
    }) => updateAutoDisposalConfig(vars.configId, vars.payload),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const disposeAfterDays = Number.parseInt(disposeAfter, 10);
    const notifyBeforeDays = Number.parseInt(notifyBefore, 10);

    if (!trimmedName) {
      toast.error('Name is required.');
      return;
    }
    if (!Number.isFinite(disposeAfterDays) || disposeAfterDays < 0) {
      toast.error('Dispose-after days must be zero or greater.');
      return;
    }
    if (!Number.isFinite(notifyBeforeDays) || notifyBeforeDays < 0) {
      toast.error('Notify-before days must be zero or greater.');
      return;
    }
    if (notifyBeforeDays > disposeAfterDays) {
      toast.error('Notify-before days cannot exceed dispose-after days.');
      return;
    }
    if (targetType === 'stage' && !stageId) {
      toast.error('Select a workflow stage.');
      return;
    }
    if (targetType === 'task_kind' && !taskKind) {
      toast.error('Select a task kind.');
      return;
    }
    if (notifyBeforeDays > 0 && !subject.trim()) {
      toast.error('Subject is required when sending a warning email.');
      return;
    }

    const payload: AutoDisposalPayload = {
      name: trimmedName,
      target_type: targetType,
      drs_workflow_stage_id: targetType === 'stage' ? stageId : null,
      task_kind: targetType === 'task_kind' ? taskKind : null,
      dispose_after_working_days: disposeAfterDays,
      notify_before_working_days: notifyBeforeDays,
      subject: subject.trim(),
      body_html: bodyHtml,
      is_enabled: isEnabled,
    };

    if (config) {
      updateMutation.mutate(
        { configId: config.id, payload },
        {
          onSuccess: () => {
            toast.success('Auto disposal rule updated.');
            onSaved();
          },
          onError: () => toast.error('Failed to update auto disposal rule.'),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Auto disposal rule created.');
          onSaved();
        },
        onError: () => toast.error('Failed to create auto disposal rule.'),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-border shrink-0 border-b px-6 py-4">
          <DialogTitle>
            {config ? 'Edit auto disposal' : 'New auto disposal'}
          </DialogTitle>
          <DialogDescription>
            Clock starts when the application enters the selected stage or task
            kind. Days are working days (weekends skipped). Warning emails
            support merge tokens (see legend when enabled).
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="auto-disp-name">Name</Label>
              <Input
                id="auto-disp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dispose 90 days after payment verification"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Attach to</Label>
                <Select
                  value={targetType}
                  onValueChange={(value) =>
                    setTargetType(value as AutoDisposalTargetType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stage">Workflow stage</SelectItem>
                    <SelectItem value="task_kind">Task kind</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {targetType === 'stage' ? (
                <div className="space-y-2">
                  <Label>Stage</Label>
                  <Select
                    value={stageId || undefined}
                    onValueChange={setStageId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Task kind</Label>
                  <Select
                    value={taskKind || undefined}
                    onValueChange={(value) =>
                      setTaskKind(value as WorkflowTaskKind)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select task kind" />
                    </SelectTrigger>
                    <SelectContent>
                      {kinds.map((kind) => (
                        <SelectItem key={kind.kind} value={kind.kind}>
                          {kind.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="auto-disp-after">
                  Working days before disposal
                </Label>
                <Input
                  id="auto-disp-after"
                  type="number"
                  min={0}
                  value={disposeAfter}
                  onChange={(e) => setDisposeAfter(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auto-disp-notify">
                  Working days before disposal to email student
                </Label>
                <Input
                  id="auto-disp-notify"
                  type="number"
                  min={0}
                  value={notifyBefore}
                  onChange={(e) => setNotifyBefore(e.target.value)}
                />
                <p className="text-muted-foreground text-xs">
                  Set to 0 to skip the warning email.
                </p>
              </div>
            </div>

            <label className="flex items-start gap-3">
              <Checkbox
                checked={isEnabled}
                onCheckedChange={(value) => setIsEnabled(value === true)}
              />
              <span className="text-sm">Enabled</span>
            </label>

            {showEmailFields ? (
              <>
                <MergeTokenLegend />
                <div className="space-y-2">
                  <Label htmlFor="auto-disp-subject">Warning subject</Label>
                  <Input
                    id="auto-disp-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Warning body</Label>
                  <RichTextEditor
                    value={bodyHtml}
                    onChange={setBodyHtml}
                    showImageButton={false}
                    minHeight="160px"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="border-border bg-muted/20 overflow-hidden rounded-md border">
                    <div className="border-border bg-background border-b px-3 py-2 text-sm">
                      <span className="text-muted-foreground">Subject: </span>
                      <span className="font-medium">
                        {previewSubject || '—'}
                      </span>
                    </div>
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none px-3 py-3 text-sm"
                      dangerouslySetInnerHTML={{ __html: previewBody }}
                    />
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <DialogFooter className="border-border shrink-0 border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : config ? 'Save changes' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
