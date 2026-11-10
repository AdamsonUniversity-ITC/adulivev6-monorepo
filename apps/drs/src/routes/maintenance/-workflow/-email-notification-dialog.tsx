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
  createEmailNotificationConfig,
  updateEmailNotificationConfig,
  type EmailNotificationPayload,
} from '../-lib/api/workflow/mutateEmailNotifications.ts';
import type {
  EmailNotificationCondition,
  EmailNotificationConfig,
  EmailNotificationTargetType,
  WorkflowKind,
  WorkflowStage,
  WorkflowTaskKind,
} from '../-lib/api/workflow/types.ts';
import { MergeTokenLegend } from './-merge-token-legend.tsx';
import {
  applyMergeTokens,
  EMAIL_SAMPLE_TOKEN_VALUES,
} from './-merge-tokens.ts';

const DEFAULT_BODY = [
  '<p>Hello,</p>',
  '<p>Your document request <strong>#{{drs_no}}</strong> has an update.</p>',
  '<p>Stage: <strong>{{stage_name}}</strong></p>',
  '<p>Status: <strong>{{status}}</strong></p>',
  '<p>Thank you.</p>',
].join('');

type Props = {
  open: boolean;
  config: EmailNotificationConfig | null;
  stages: WorkflowStage[];
  kinds: WorkflowKind[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export const EmailNotificationDialog = ({
  open,
  config,
  stages,
  kinds,
  onOpenChange,
  onSaved,
}: Props) => {
  const [name, setName] = useState('');
  const [targetType, setTargetType] =
    useState<EmailNotificationTargetType>('stage');
  const [stageId, setStageId] = useState('');
  const [taskKind, setTaskKind] = useState<WorkflowTaskKind | ''>('');
  const [condition, setCondition] =
    useState<EmailNotificationCondition>('into');
  const [notifyStudent, setNotifyStudent] = useState(true);
  const [notifyStaff, setNotifyStaff] = useState(false);
  const [subject, setSubject] = useState('DRS request update: {{stage_name}}');
  const [bodyHtml, setBodyHtml] = useState(DEFAULT_BODY);
  const [isEnabled, setIsEnabled] = useState(true);

  const isManual = condition === 'manual';

  useEffect(() => {
    if (!open) return;
    const nextCondition = config?.condition ?? 'into';
    const nextIsManual = nextCondition === 'manual';
    setName(config?.name ?? '');
    setTargetType(
      nextIsManual ? 'task_kind' : (config?.target_type ?? 'stage'),
    );
    setStageId(config?.drs_workflow_stage_id ?? '');
    setTaskKind(
      nextIsManual
        ? 'clearance_signoff'
        : (config?.task_kind ?? ''),
    );
    setCondition(nextCondition);
    setNotifyStudent(nextIsManual ? true : (config?.notify_student ?? true));
    setNotifyStaff(nextIsManual ? false : (config?.notify_staff ?? false));
    setSubject(config?.subject ?? 'DRS request update: {{stage_name}}');
    setBodyHtml(config?.body_html ?? DEFAULT_BODY);
    setIsEnabled(config?.is_enabled ?? true);
  }, [open, config]);

  useEffect(() => {
    if (!isManual) return;
    setTargetType('task_kind');
    setTaskKind('clearance_signoff');
    setNotifyStudent(true);
    setNotifyStaff(false);
  }, [isManual]);

  const previewSubject = useMemo(
    () => applyMergeTokens(subject, EMAIL_SAMPLE_TOKEN_VALUES),
    [subject],
  );
  const previewBody = useMemo(
    () =>
      sanitizeRichTextHtml(
        applyMergeTokens(bodyHtml, EMAIL_SAMPLE_TOKEN_VALUES),
      ),
    [bodyHtml],
  );

  const createMutation = useMutation({
    mutationFn: createEmailNotificationConfig,
  });
  const updateMutation = useMutation({
    mutationFn: (vars: {
      configId: string | number;
      payload: Partial<EmailNotificationPayload>;
    }) => updateEmailNotificationConfig(vars.configId, vars.payload),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedSubject = subject.trim();

    if (!trimmedName) {
      toast.error('Name is required.');
      return;
    }
    if (!trimmedSubject) {
      toast.error('Subject is required.');
      return;
    }
    if (!isManual && !notifyStudent && !notifyStaff) {
      toast.error('Select at least one recipient.');
      return;
    }
    if (!isManual && targetType === 'stage' && !stageId) {
      toast.error('Select a workflow stage.');
      return;
    }
    if (!isManual && targetType === 'task_kind' && !taskKind) {
      toast.error('Select a task kind.');
      return;
    }

    const payload: EmailNotificationPayload = {
      name: trimmedName,
      target_type: isManual ? 'task_kind' : targetType,
      drs_workflow_stage_id:
        !isManual && targetType === 'stage' ? stageId : null,
      task_kind: isManual
        ? 'clearance_signoff'
        : targetType === 'task_kind'
          ? taskKind
          : null,
      condition,
      notify_student: isManual ? true : notifyStudent,
      notify_staff: isManual ? false : notifyStaff,
      subject: trimmedSubject,
      body_html: bodyHtml,
      is_enabled: isEnabled,
    };

    if (config) {
      updateMutation.mutate(
        { configId: config.id, payload },
        {
          onSuccess: () => {
            toast.success('Email notification updated.');
            onSaved();
          },
          onError: () => toast.error('Failed to update email notification.'),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Email notification created.');
          onSaved();
        },
        onError: () => toast.error('Failed to create email notification.'),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-border shrink-0 border-b px-6 py-4">
          <DialogTitle>
            {config ? 'Edit email notification' : 'New email notification'}
          </DialogTitle>
          <DialogDescription>
            Attach to a workflow stage or task kind, or choose Manual notify for
            the clearance &quot;Notify student by email&quot; button. Subject
            and body support merge tokens (see legend below).
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <MergeTokenLegend />
            <div className="space-y-2">
              <Label htmlFor="email-notif-name">Name</Label>
              <Input
                id="email-notif-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Student enter: For Assessment"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Attach to</Label>
                <Select
                  value={targetType}
                  disabled={isManual}
                  onValueChange={(value) =>
                    setTargetType(value as EmailNotificationTargetType)
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
              <div className="space-y-2">
                <Label>Condition</Label>
                <Select
                  value={condition}
                  onValueChange={(value) =>
                    setCondition(value as EmailNotificationCondition)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="into">Into</SelectItem>
                    <SelectItem value="out_of">Out of</SelectItem>
                    <SelectItem value="manual">
                      Manual notify (button)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isManual ? (
              <p className="text-muted-foreground text-sm">
                Locked to Clearance sign-off and student only. Used by the
                staff &quot;Notify student by email&quot; button.
              </p>
            ) : targetType === 'stage' ? (
              <div className="space-y-2">
                <Label>Stage</Label>
                <Select value={stageId || undefined} onValueChange={setStageId}>
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

            <div className="space-y-3">
              <Label>Recipients</Label>
              <div className="flex flex-col gap-3">
                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={notifyStudent}
                    disabled={isManual}
                    onCheckedChange={(value) =>
                      setNotifyStudent(value === true)
                    }
                  />
                  <span className="text-sm">
                    Student (application contact email)
                  </span>
                </label>
                {!isManual ? (
                  <label className="flex items-start gap-3">
                    <Checkbox
                      checked={notifyStaff}
                      onCheckedChange={(value) =>
                        setNotifyStaff(value === true)
                      }
                    />
                    <span className="text-sm">
                      Staff (task-kind roster emails)
                    </span>
                  </label>
                ) : null}
                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={isEnabled}
                    onCheckedChange={(value) => setIsEnabled(value === true)}
                  />
                  <span className="text-sm">Enabled</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-notif-subject">Subject</Label>
              <Input
                id="email-notif-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Body</Label>
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
                  <span className="font-medium">{previewSubject || '—'}</span>
                </div>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none px-3 py-3 text-sm"
                  dangerouslySetInnerHTML={{ __html: previewBody }}
                />
              </div>
            </div>
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
