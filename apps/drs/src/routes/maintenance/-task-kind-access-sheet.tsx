import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/dialog';
import { Label } from '@repo/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import { toast } from '@repo/ui/exports';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { JSX, useMemo, useState } from 'react';
import { importTaskKindAccess } from './-lib/api/access/importTaskKindAccess.ts';
import { useMaintenanceNavigation } from './-maintenance-navigation-context.tsx';
import {
  TASK_KIND_SLIDE_KINDS,
  TASK_KIND_SLIDE_META,
  type TaskKindSlideKind,
} from './-task-kind-slides.ts';
import { TaskKindAccessPanel } from './-workflow/-task-kind-access-panel.tsx';

type Props = {
  kind: TaskKindSlideKind;
};

const taskKindAccessKey = (kind: string) =>
  ['drs', 'workflow', 'task-kind', kind, 'access'] as const;

const DEFAULT_SOURCE_KIND: TaskKindSlideKind = 'processing';

const pluralize = (count: number, label: string): string =>
  `${count} ${label}${count === 1 ? '' : 's'}`;

export const TaskKindAccessSheet = ({ kind }: Props): JSX.Element => {
  const queryClient = useQueryClient();
  const { openUserManagement } = useMaintenanceNavigation();
  const meta = TASK_KIND_SLIDE_META[kind];
  const sourceOptions = useMemo(
    () => TASK_KIND_SLIDE_KINDS.filter((candidate) => candidate !== kind),
    [kind],
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sourceKind, setSourceKind] = useState<TaskKindSlideKind>(
    sourceOptions[0] ?? DEFAULT_SOURCE_KIND,
  );

  const importMutation = useMutation({
    mutationFn: () =>
      importTaskKindAccess(kind, {
        source_kind: sourceKind,
      }),
    onSuccess: (summary) => {
      queryClient.invalidateQueries({ queryKey: taskKindAccessKey(kind) });
      queryClient.invalidateQueries({
        queryKey: taskKindAccessKey(sourceKind),
      });
      setDialogOpen(false);
      toast.success(
        `Imported ${pluralize(summary.users.imported, 'employee')} and ${pluralize(summary.roles.imported, 'role')}.`,
      );
    },
    onError: () => toast.error('Failed to import roster.'),
  });

  const selectedSourceMeta = TASK_KIND_SLIDE_META[sourceKind];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-foreground text-lg font-semibold">{meta.label}</h2>
        <p className="text-muted-foreground text-sm">{meta.description}</p>
      </div>

      <Card className="border-border border">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base">Operator access</CardTitle>
            <CardDescription>{meta.accessDescription}</CardDescription>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={openUserManagement}
            >
              Manage in User Management
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" size="sm" variant="outline">
                  <Download className="h-4 w-4" />
                  Import roster
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Import roster</DialogTitle>
                  <DialogDescription>
                    Copy missing employees and attached roles from another task
                    kind into {meta.label}. Existing {meta.label} employees stay
                    unchanged.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor={`import-source-${kind}`}>Import from</Label>
                    <Select
                      value={sourceKind}
                      onValueChange={(value) =>
                        setSourceKind(value as TaskKindSlideKind)
                      }
                      disabled={importMutation.isPending}
                    >
                      <SelectTrigger
                        id={`import-source-${kind}`}
                        className="mt-1"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {TASK_KIND_SLIDE_META[option].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <p className="text-muted-foreground rounded-md border p-3 text-xs">
                    This will merge {selectedSourceMeta.label} employees and
                    roles into {meta.label}. Employees already assigned to{' '}
                    {meta.label} will be skipped.
                  </p>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={importMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => importMutation.mutate()}
                    disabled={importMutation.isPending || !sourceKind}
                  >
                    {importMutation.isPending ? 'Importing…' : 'Import roster'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <TaskKindAccessPanel
            kind={kind}
            title={meta.label}
            defaultExpanded
            readOnly
            readOnlyDescription="Employee assignment is centralized in User Management."
          />
        </CardContent>
      </Card>
    </div>
  );
};
