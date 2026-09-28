import { Button } from '@repo/ui/components/button';
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
import { toast } from '@repo/ui/exports';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { JSX, useEffect, useState } from 'react';

import { deleteFlagDefinition } from '../-lib/api/deleteFlagDefinition.ts';
import { patchFlagDefinition } from '../-lib/api/patchFlagDefinition.ts';
import { postFlagDefinition } from '../-lib/api/postFlagDefinition.ts';
import { type FlagIconName } from '../-lib/flag-icons.ts';
import type { DRSEmployeeFlagDefinition } from '../-lib/types/flag-definitions.ts';
import { FlagIconPicker } from './flag-icon-picker.tsx';
import { resolveFlagIcon } from '../-lib/flag-icons.ts';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  definitions: DRSEmployeeFlagDefinition[];
};

export function ManageFlagDefinitionsDialog({
  open,
  onOpenChange,
  definitions,
}: Props): JSX.Element {
  const queryClient = useQueryClient();
  const [newLabel, setNewLabel] = useState('');
  const [newIcon, setNewIcon] = useState<FlagIconName>('Flag');
  const [drafts, setDrafts] = useState<
    Record<string, { label: string; icon: FlagIconName }>
  >({});

  useEffect(() => {
    if (!open) return;
    setDrafts(
      Object.fromEntries(
        definitions.map((def) => [
          def.id,
          { label: def.label, icon: def.icon as FlagIconName },
        ]),
      ),
    );
  }, [definitions, open]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['drs-flag-definitions'] });
    await queryClient.invalidateQueries({ queryKey: ['drs-employee-queue'] });
    await queryClient.invalidateQueries({
      queryKey: ['drs-employee-application'],
    });
  };

  const createMutation = useMutation({
    mutationFn: () =>
      postFlagDefinition({ label: newLabel.trim(), icon: newIcon }),
    onSuccess: async () => {
      setNewLabel('');
      setNewIcon('Flag');
      await invalidate();
      toast.success('Flag created.');
    },
    onError: () => toast.error('Could not create flag.'),
  });

  const updateMutation = useMutation({
    mutationFn: (vars: {
      id: string;
      label: string;
      icon: FlagIconName;
    }) => patchFlagDefinition(vars.id, { label: vars.label, icon: vars.icon }),
    onSuccess: async () => {
      await invalidate();
      toast.success('Flag updated.');
    },
    onError: () => toast.error('Could not update flag.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFlagDefinition(id),
    onSuccess: async () => {
      await invalidate();
      toast.success('Flag deleted.');
    },
    onError: () => toast.error('Could not delete flag.'),
  });

  const pending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage flags</DialogTitle>
          <DialogDescription>
            Create personal flags with a label and icon. Deleting a flag removes
            it from all applications in your queue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-3 border-b pb-4">
            <p className="text-sm font-medium">New flag</p>
            <div className="space-y-2">
              <Label htmlFor="new-flag-label">Label</Label>
              <Input
                id="new-flag-label"
                value={newLabel}
                onChange={(event) => setNewLabel(event.target.value)}
                placeholder="e.g. Needs follow-up"
                maxLength={64}
                disabled={pending}
              />
            </div>
            <FlagIconPicker
              value={newIcon}
              onChange={setNewIcon}
              disabled={pending}
            />
            <Button
              type="button"
              size="sm"
              disabled={pending || !newLabel.trim()}
              onClick={() => createMutation.mutate()}
            >
              Add flag
            </Button>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Your flags</p>
            {definitions.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No custom flags yet.
              </p>
            ) : (
              <ul className="divide-border/70 max-h-64 divide-y overflow-y-auto border-y">
                {definitions.map((def) => {
                  const draft = drafts[def.id] ?? {
                    label: def.label,
                    icon: def.icon as FlagIconName,
                  };
                  const Icon = resolveFlagIcon(draft.icon);
                  const dirty =
                    draft.label !== def.label || draft.icon !== def.icon;

                  return (
                    <li key={def.id} className="space-y-2 py-3">
                      <div className="flex items-center gap-2">
                        {Icon ? (
                          <Icon
                            className="text-muted-foreground size-4 shrink-0"
                            aria-hidden="true"
                          />
                        ) : null}
                        <Input
                          value={draft.label}
                          onChange={(event) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [def.id]: {
                                ...draft,
                                label: event.target.value,
                              },
                            }))
                          }
                          maxLength={64}
                          disabled={pending}
                          className="h-8"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          disabled={pending}
                          aria-label={`Delete ${def.label}`}
                          onClick={() => deleteMutation.mutate(def.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      <FlagIconPicker
                        value={draft.icon}
                        onChange={(icon) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [def.id]: { ...draft, icon },
                          }))
                        }
                        disabled={pending}
                      />
                      {dirty ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={pending || !draft.label.trim()}
                          onClick={() =>
                            updateMutation.mutate({
                              id: def.id,
                              label: draft.label.trim(),
                              icon: draft.icon,
                            })
                          }
                        >
                          Save changes
                        </Button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
