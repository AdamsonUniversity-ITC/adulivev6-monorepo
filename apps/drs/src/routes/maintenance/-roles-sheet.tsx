import {
  DrsEmptyState,
  DrsErrorState,
  DrsLoadingState,
  DrsSearchField,
  DrsTableSkeleton,
} from '@/components/drs-ui.tsx';
import { fetchAuthUser, normalizePermissions } from '@/lib/fetchAuthUser.ts';
import { checkPermission } from '@repo/hooks';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/components/alert-dialog';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Checkbox } from '@repo/ui/components/checkbox';
import {
  Card,
  CardContent,
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
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { type JSX, useEffect, useMemo, useState } from 'react';
import {
  DRS_ADMIN_ACCESS_PERMISSION,
  formatRolePermissionName,
} from './-lib/api/access/permissionLabels.ts';
import { createDrsRole } from './-lib/api/roles/createDrsRole.ts';
import { deleteDrsRole } from './-lib/api/roles/deleteDrsRole.ts';
import { fetchDrsPermissions } from './-lib/api/roles/fetchDrsPermissions.ts';
import { fetchDrsRoles } from './-lib/api/roles/fetchDrsRoles.ts';
import type { DrsRole } from './-lib/api/roles/types.ts';
import { updateDrsRolePermissions } from './-lib/api/roles/updateDrsRolePermissions.ts';
import { useDebouncedValue } from './-lib/hooks/useDebouncedValue.ts';

const rolesKey = ['drs', 'user-management', 'roles'] as const;
const permissionsKey = ['drs', 'user-management', 'permissions'] as const;

export function RolesSheet(): JSX.Element {
  const [search, setSearch] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const debounced = useDebouncedValue(search.trim(), 300);
  const authQuery = useQuery({
    queryKey: ['drs', 'auth-user'],
    queryFn: async () => {
      const { data } = await fetchAuthUser();
      return normalizePermissions(data);
    },
    refetchOnWindowFocus: false,
  });
  const canManage = checkPermission(
    authQuery.data ?? [],
    DRS_ADMIN_ACCESS_PERMISSION,
  );

  const rolesQuery = useQuery({
    queryKey: [...rolesKey, debounced],
    queryFn: () => fetchDrsRoles(debounced || undefined),
    refetchOnWindowFocus: false,
  });

  const roles = rolesQuery.data ?? [];
  const selected =
    roles.find((role) => role.id === selectedRoleId) ?? roles[0] ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)]">
      <Card className="drs-card">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-base">Roles</CardTitle>
            {canManage ? (
              <CreateDrsRoleDialog
                onCreated={(role) => setSelectedRoleId(role.id)}
              />
            ) : null}
          </div>
          <DrsSearchField
            label="Search roles"
            placeholder="Search by role name"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </CardHeader>
        <CardContent>
          {rolesQuery.isLoading ? (
            <DrsTableSkeleton rows={5} columns={2} />
          ) : rolesQuery.isError ? (
            <DrsErrorState
              title="Could not load roles"
              description="The role list did not respond. Check your connection and try again."
            />
          ) : roles.length === 0 ? (
            <DrsEmptyState
              title={search ? 'No matching roles' : 'No DRS roles yet'}
              description={
                search
                  ? 'No DRS role matches that name. Try a shorter search term.'
                  : 'Create a DRS role, attach permissions to it, then assign it to users.'
              }
            />
          ) : (
            <ul className="divide-border/70 divide-y">
              {roles.map((role) => (
                <li key={role.id}>
                  <button
                    type="button"
                    className="hover:bg-muted/40 flex w-full items-center justify-between gap-3 px-1 py-3 text-left"
                    onClick={() => setSelectedRoleId(role.id)}
                  >
                    <span>
                      <span className="block text-sm font-medium">
                        {role.name}
                      </span>
                      <span className="text-muted-foreground block text-xs">
                        {role.permissions.length} permission
                        {role.permissions.length === 1 ? '' : 's'}
                      </span>
                    </span>
                    {selected?.id === role.id ? (
                      <Badge variant="secondary">Selected</Badge>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {selected ? (
        <RoleDetailPanel role={selected} />
      ) : (
        <DrsEmptyState
          title="Select a role"
          description="Select a role to attach DRS permissions to it."
        />
      )}
    </div>
  );
}

function RoleDetailPanel({ role }: { role: DrsRole }): JSX.Element {
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const authQuery = useQuery({
    queryKey: ['drs', 'auth-user'],
    queryFn: async () => {
      const { data } = await fetchAuthUser();
      return normalizePermissions(data);
    },
    refetchOnWindowFocus: false,
  });
  const canManage = checkPermission(
    authQuery.data ?? [],
    DRS_ADMIN_ACCESS_PERMISSION,
  );

  const permissionsQuery = useQuery({
    queryKey: permissionsKey,
    queryFn: () => fetchDrsPermissions(),
    refetchOnWindowFocus: false,
  });

  const attached = useMemo(
    () =>
      role.permissions
        .map((permission) => permission.name)
        .filter((name) => name.startsWith('drs_')),
    [role.permissions],
  );
  const [selected, setSelected] = useState<string[]>(attached);

  useEffect(() => {
    setSelected(attached);
  }, [role.id, attached]);

  const dirty = useMemo(() => {
    if (selected.length !== attached.length) return true;
    const left = [...selected].sort();
    const right = [...attached].sort();
    return left.some((value, index) => value !== right[index]);
  }, [selected, attached]);

  const saveMutation = useMutation({
    mutationFn: () => updateDrsRolePermissions(role.id, selected),
    onSuccess: () => {
      toast.success('Role permissions updated.');
      void queryClient.invalidateQueries({ queryKey: rolesKey });
    },
    onError: () => toast.error('Failed to update role permissions.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteDrsRole(role.id),
    onSuccess: () => {
      toast.success('Role deleted.');
      setConfirmDelete(false);
      void queryClient.invalidateQueries({ queryKey: rolesKey });
    },
    onError: () => toast.error('Failed to delete role.'),
  });

  const permissions = permissionsQuery.data ?? [];

  return (
    <Card className="drs-card">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{role.name}</CardTitle>
            <p className="text-muted-foreground text-xs">
              Permissions on this role apply to every user who holds it.
            </p>
          </div>
          {canManage ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {permissionsQuery.isLoading ? (
          <DrsLoadingState label="Loading permissions…" />
        ) : permissionsQuery.isError ? (
          <DrsErrorState
            title="Could not load permissions"
            description="The permission list did not respond. Close this panel and try again."
          />
        ) : permissions.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            No DRS permissions are registered yet.
          </p>
        ) : (
          <div className="max-h-[28rem] space-y-1 overflow-y-auto">
            {permissions.map((permission) => (
              <label
                key={permission.id || permission.name}
                className="flex items-start gap-2 rounded-md px-1 py-1.5 text-sm"
              >
                <Checkbox
                  checked={selected.includes(permission.name)}
                  disabled={!canManage || saveMutation.isPending}
                  onCheckedChange={(checked) => {
                    setSelected((current) =>
                      checked === true
                        ? [...current, permission.name]
                        : current.filter((name) => name !== permission.name),
                    );
                  }}
                  aria-label={formatRolePermissionName(permission.name)}
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
            ))}
          </div>
        )}

        {canManage ? (
          <Button
            type="button"
            disabled={!dirty || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? 'Saving…' : 'Save permissions'}
          </Button>
        ) : null}
      </CardContent>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {role.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Users who currently have this role will lose the permissions it
              granted. This does not remove their other roles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete role'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function CreateDrsRoleDialog({
  onCreated,
}: {
  onCreated: (role: DrsRole) => void;
}): JSX.Element {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const permissionsQuery = useQuery({
    queryKey: permissionsKey,
    queryFn: () => fetchDrsPermissions(),
    enabled: open,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createDrsRole({
        name: name.trim(),
        permissions: selectedPermissions,
      }),
    onSuccess: (role) => {
      toast.success('Role created.');
      void queryClient.invalidateQueries({ queryKey: rolesKey });
      onCreated(role);
      setName('');
      setSelectedPermissions([]);
      setError(null);
      setOpen(false);
    },
    onError: () => toast.error('Failed to create role.'),
  });

  const previewName = name.trim()
    ? name.trim().toLowerCase().startsWith('drs ') ||
      name.trim().toLowerCase().startsWith('drs-')
      ? name.trim()
      : `DRS ${name.trim()}`
    : 'DRS …';

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setName('');
          setSelectedPermissions([]);
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New role
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create DRS role</DialogTitle>
          <DialogDescription>
            The role is saved as {previewName}. Only DRS permissions can be
            attached.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="drs-role-name">Role name</Label>
            <Input
              id="drs-role-name"
              className="mt-1"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Cashier"
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
                  No DRS permissions available.
                </p>
              ) : (
                (permissionsQuery.data ?? []).map((permission) => (
                  <label
                    key={permission.id || permission.name}
                    className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs"
                  >
                    <Checkbox
                      checked={selectedPermissions.includes(permission.name)}
                      onCheckedChange={(checked) =>
                        setSelectedPermissions((current) =>
                          checked === true
                            ? [...current, permission.name]
                            : current.filter(
                                (value) => value !== permission.name,
                              ),
                        )
                      }
                    />
                    <span>{formatRolePermissionName(permission.name)}</span>
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
            disabled={createMutation.isPending}
            onClick={() => {
              if (!name.trim()) {
                setError('Required');
                return;
              }
              setError(null);
              createMutation.mutate();
            }}
          >
            {createMutation.isPending ? 'Creating…' : 'Create role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
