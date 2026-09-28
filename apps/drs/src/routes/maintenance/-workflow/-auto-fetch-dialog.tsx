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
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FlagIconPicker } from '../../-components/flag-icon-picker.tsx';
import type { FlagIconName } from '../../-lib/flag-icons.ts';
import {
  createAutoFetchConfig,
  updateAutoFetchConfig,
  type AutoFetchPayload,
} from '../-lib/api/workflow/mutateAutoFetchConfigs.ts';
import type {
  AutoFetchAction,
  AutoFetchConfig,
  AutoFetchRowColorOp,
  AutoFetchSource,
  AutoFetchTargetType,
  AutoFetchThresholdRule,
  AutoFetchTone,
  WorkflowKind,
  WorkflowStage,
  WorkflowTaskKind,
} from '../-lib/api/workflow/types.ts';

const OPS: Array<{ value: AutoFetchRowColorOp; label: string }> = [
  { value: 'gt', label: '>' },
  { value: 'gte', label: '≥' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '≤' },
  { value: 'eq', label: '=' },
  { value: 'neq', label: '≠' },
];

const TONES: AutoFetchTone[] = [
  'danger',
  'warning',
  'success',
  'info',
  'neutral',
];

const SOURCES: Array<{ value: AutoFetchSource; label: string; unit: string }> = [
  { value: 'student_balance', label: 'Student balance', unit: 'peso amount' },
  {
    value: 'unreturned_books',
    label: 'Unreturned library books',
    unit: 'book count',
  },
  { value: 'osl_violations', label: 'OSL violations', unit: 'open violation count' },
  { value: 'tbi_holds', label: 'TBI holds', unit: 'open hold count' },
  {
    value: 'probationary',
    label: 'Probationary status',
    unit: 'probationary record count',
  },
];

const defaultColorRules = (): AutoFetchThresholdRule[] => [
  { op: 'gt', amount: 0, tone: 'danger', label: 'Has balance' },
  { op: 'lte', amount: 0, tone: 'success', label: 'Cleared' },
];

const defaultFlagRules = (): AutoFetchThresholdRule[] => [
  { op: 'gt', amount: 0, label: 'Needs attention', icon: 'AlertTriangle' },
];

type Props = {
  open: boolean;
  config: AutoFetchConfig | null;
  stages: WorkflowStage[];
  kinds: WorkflowKind[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export const AutoFetchDialog = ({
  open,
  config,
  stages,
  kinds,
  onOpenChange,
  onSaved,
}: Props) => {
  const [name, setName] = useState('');
  const [targetType, setTargetType] =
    useState<AutoFetchTargetType>('task_kind');
  const [stageId, setStageId] = useState('');
  const [taskKind, setTaskKind] = useState<WorkflowTaskKind | ''>('');
  const [runAtTime, setRunAtTime] = useState('02:00');
  const [source, setSource] = useState<AutoFetchSource>('student_balance');
  const [action, setAction] = useState<AutoFetchAction>('row_color');
  const [rules, setRules] = useState<AutoFetchThresholdRule[]>(defaultColorRules);
  const [fallbackTone, setFallbackTone] = useState<AutoFetchTone>('neutral');
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    if (!open) return;
    const nextAction = config?.action ?? 'row_color';
    setName(config?.name ?? '');
    setTargetType(config?.target_type ?? 'task_kind');
    setStageId(config?.drs_workflow_stage_id ?? '');
    setTaskKind(config?.task_kind ?? '');
    setRunAtTime(config?.run_at_time ?? '02:00');
    setSource(config?.source ?? 'student_balance');
    setAction(nextAction);
    setRules(
      config?.action_config_json?.rules?.length
        ? config.action_config_json.rules
        : nextAction === 'row_flag'
          ? defaultFlagRules()
          : defaultColorRules(),
    );
    setFallbackTone(config?.action_config_json?.fallback_tone ?? 'neutral');
    setIsEnabled(config?.is_enabled ?? true);
  }, [open, config]);

  const sourceUnit =
    SOURCES.find((item) => item.value === source)?.unit ?? 'value';

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: AutoFetchPayload = {
        name: name.trim(),
        target_type: targetType,
        drs_workflow_stage_id:
          targetType === 'stage' ? stageId || null : null,
        task_kind: targetType === 'task_kind' ? taskKind || null : null,
        source,
        action,
        action_config_json:
          action === 'row_flag'
            ? {
                rules: rules.map((rule) => ({
                  op: rule.op,
                  amount: Number(rule.amount),
                  label: rule.label?.trim() ? rule.label.trim() : null,
                  icon: rule.icon ?? 'Flag',
                })),
              }
            : {
                rules: rules.map((rule) => ({
                  op: rule.op,
                  amount: Number(rule.amount),
                  tone: rule.tone ?? 'neutral',
                  label: rule.label?.trim() ? rule.label.trim() : null,
                })),
                fallback_tone: fallbackTone,
              },
        run_at_time: runAtTime,
        is_enabled: isEnabled,
      };

      if (!payload.name) {
        throw new Error('Name is required.');
      }
      if (targetType === 'stage' && !stageId) {
        throw new Error('Select a workflow stage.');
      }
      if (targetType === 'task_kind' && !taskKind) {
        throw new Error('Select a task kind.');
      }
      if (!/^\d{2}:\d{2}$/.test(runAtTime)) {
        throw new Error('Run time must be HH:MM.');
      }
      if (rules.length === 0) {
        throw new Error('Add at least one threshold rule.');
      }
      if (action === 'row_flag' && rules.some((rule) => !rule.label?.trim())) {
        throw new Error('Each flag threshold needs a label.');
      }

      if (config) {
        return updateAutoFetchConfig(config.id, payload);
      }
      return createAutoFetchConfig(payload);
    },
    onSuccess: () => {
      toast.success(config ? 'Auto-fetch rule updated.' : 'Auto-fetch rule created.');
      onSaved();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save auto-fetch rule.');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {config ? 'Edit auto-fetch rule' : 'Add auto-fetch rule'}
          </DialogTitle>
          <DialogDescription>
            Fetch a student data source on a daily schedule, then color or flag
            queue rows for applications in the selected stage or task kind.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="auto-fetch-name">Name</Label>
            <Input
              id="auto-fetch-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Balance highlight — payment stage"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Data source</Label>
              <Select
                value={source}
                onValueChange={(value) => setSource(value as AutoFetchSource)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Action</Label>
              <Select
                value={action}
                onValueChange={(value) => {
                  const next = value as AutoFetchAction;
                  setAction(next);
                  setRules(next === 'row_flag' ? defaultFlagRules() : defaultColorRules());
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="row_color">Color the row</SelectItem>
                  <SelectItem value="row_flag">Flag the row</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Target</Label>
              <Select
                value={targetType}
                onValueChange={(value) =>
                  setTargetType(value as AutoFetchTargetType)
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
              <Label htmlFor="auto-fetch-time">Daily run time</Label>
              <Input
                id="auto-fetch-time"
                type="time"
                value={runAtTime}
                onChange={(event) => setRunAtTime(event.target.value)}
              />
            </div>
          </div>

          {targetType === 'stage' ? (
            <div className="space-y-2">
              <Label>Stage</Label>
              <Select value={stageId} onValueChange={setStageId}>
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
                value={taskKind}
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

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <Label>Thresholds (first match wins)</Label>
                <p className="text-muted-foreground text-xs">
                  Compared against the {sourceUnit}.
                  {action === 'row_flag'
                    ? ' No match removes the flag.'
                    : ''}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setRules((prev) => [
                    ...prev,
                    action === 'row_flag'
                      ? { op: 'gt', amount: 0, label: '', icon: 'Flag' }
                      : { op: 'gt', amount: 0, tone: 'warning', label: '' },
                  ])
                }
              >
                <Plus className="size-4" />
                Rule
              </Button>
            </div>
            <ul className="space-y-2">
              {rules.map((rule, index) => (
                <li
                  key={`rule-${index}`}
                  className="border-border grid gap-2 rounded-md border p-2 sm:grid-cols-[4.5rem_6rem_7rem_minmax(0,1fr)_2rem]"
                >
                  <Select
                    value={rule.op}
                    onValueChange={(value) =>
                      setRules((prev) =>
                        prev.map((row, i) =>
                          i === index
                            ? { ...row, op: value as AutoFetchRowColorOp }
                            : row,
                        ),
                      )
                    }
                  >
                    <SelectTrigger aria-label="Operator">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPS.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    value={String(rule.amount)}
                    onChange={(event) =>
                      setRules((prev) =>
                        prev.map((row, i) =>
                          i === index
                            ? {
                                ...row,
                                amount: Number(event.target.value) || 0,
                              }
                            : row,
                        ),
                      )
                    }
                    aria-label={source === 'student_balance' ? 'Amount' : 'Count'}
                  />
                  {action === 'row_color' ? (
                    <Select
                      value={rule.tone ?? 'neutral'}
                      onValueChange={(value) =>
                        setRules((prev) =>
                          prev.map((row, i) =>
                            i === index
                              ? { ...row, tone: value as AutoFetchTone }
                              : row,
                          ),
                        )
                      }
                    >
                      <SelectTrigger aria-label="Tone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TONES.map((tone) => (
                          <SelectItem key={tone} value={tone}>
                            {tone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <FlagIconPicker
                      value={(rule.icon as FlagIconName) || 'Flag'}
                      onChange={(icon) =>
                        setRules((prev) =>
                          prev.map((row, i) =>
                            i === index ? { ...row, icon } : row,
                          ),
                        )
                      }
                      className="col-span-full"
                    />
                  )}
                  <Input
                    value={rule.label ?? ''}
                    onChange={(event) =>
                      setRules((prev) =>
                        prev.map((row, i) =>
                          i === index
                            ? { ...row, label: event.target.value }
                            : row,
                        ),
                      )
                    }
                    placeholder="Label"
                    aria-label="Label"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={rules.length <= 1}
                    onClick={() =>
                      setRules((prev) => prev.filter((_, i) => i !== index))
                    }
                    aria-label="Remove rule"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          {action === 'row_color' ? (
          <div className="space-y-2">
            <Label>Fallback tone</Label>
            <Select
              value={fallbackTone}
              onValueChange={(value) =>
                setFallbackTone(value as AutoFetchTone)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((tone) => (
                  <SelectItem key={tone} value={tone}>
                    {tone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          ) : null}

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={isEnabled}
              onCheckedChange={(checked) => setIsEnabled(checked === true)}
            />
            Enabled
          </label>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
