import { Button } from '@repo/ui/components/button';
import { Checkbox } from '@repo/ui/components/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/dialog';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { JSX, useState } from 'react';
import { z } from 'zod';
import { createRole } from '../-lib/api/access/createRole.ts';
import { fetchPermissions } from '../-lib/api/access/fetchPermissions.ts';
import { formatRolePermissionName } from '../-lib/api/access/permissionLabels.ts';

type Props = {
  onCreated?: () => void;
};

const roleSchema = z.object({
  name: z.string().trim().min(1, 'Required').max(125),
});

export const CreateRoleDialog = ({ onCreated }: Props): JSX.Element => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const permissionsQuery = useQuery({
    queryKey: ['drs', 'workflow', 'permissions'],
    queryFn: () => fetchPermissions(),
    enabled: open,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createRole({ name: name.trim(), permissions: selectedPermissions }),
    onSuccess: () => {
      toast.success('Role created.');
      queryClient.invalidateQueries({ queryKey: ['drs', 'workflow', 'roles'] });
      onCreated?.();
      reset();
      setOpen(false);
    },
    onError: () => {
      toast.error('Failed to create role.');
    },
  });

  const reset = () => {
    setName('');
    setSelectedPermissions([]);
    setError(null);
  };

  const handleSubmit = () => {
    const parsed = roleSchema.safeParse({ name });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid name.');
      return;
    }
    setError(null);
    createMutation.mutate();
  };

  const togglePermission = (permission: string, checked: boolean) => {
    setSelectedPermissions((current) =>
      checked
        ? Array.from(new Set([...current, permission]))
        : current.filter((value) => value !== permission),
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <Plus className="h-3 w-3" />
          New role
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create role</DialogTitle>
          <DialogDescription>
            Roles live in the auth service and can be reused across stages.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="new-role-name">Role name</Label>
            <Input
              id="new-role-name"
              className="mt-1"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. registrar.cashier"
              autoFocus
            />
            {error ? (
              <p className="text-destructive mt-1 text-xs">{error}</p>
            ) : null}
          </div>
          <div>
            <Label>Permissions</Label>
            <div className="mt-1 max-h-48 space-y-1 overflow-y-auto rounded-md border p-1">
              {permissionsQuery.isLoading ? (
                <p className="text-muted-foreground p-2 text-xs">
                  Loading permissions…
                </p>
              ) : (permissionsQuery.data ?? []).length === 0 ? (
                <p className="text-muted-foreground p-2 text-xs">
                  No permissions available.
                </p>
              ) : (
                (permissionsQuery.data ?? []).map((permission) => (
                  <label
                    key={permission.id}
                    htmlFor={`perm-${permission.id}`}
                    className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs"
                  >
                    <Checkbox
                      id={`perm-${permission.id}`}
                      checked={selectedPermissions.includes(permission.name)}
                      onCheckedChange={(checked) =>
                        togglePermission(permission.name, Boolean(checked))
                      }
                    />
                    <span className="min-w-0">
                      <span className="block">
                        {formatRolePermissionName(permission.name)}
                      </span>
                      {formatRolePermissionName(permission.name) !==
                      permission.name ? (
                        <span className="text-muted-foreground block font-mono text-[10px]">
                          {permission.name}
                        </span>
                      ) : null}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating…' : 'Create role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
