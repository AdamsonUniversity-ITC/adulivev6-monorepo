import { DrsInlineLoading } from '@/components/drs-ui.tsx';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Input } from '@repo/ui/components/input';
import { useQuery } from '@tanstack/react-query';
import { JSX, useEffect, useMemo, useState } from 'react';
import { fetchRoles } from '../-lib/api/access/fetchRoles.ts';
import { formatRolePermissionName } from '../-lib/api/access/permissionLabels.ts';
import type { Role, TaskKindRoleAccess } from '../-lib/api/access/types.ts';

type Props = {
  attachedRoles: TaskKindRoleAccess[];
  onSync: (roleNames: string[]) => void;
  isSyncing: boolean;
};

export const TaskKindAccessRolesTab = ({
  attachedRoles,
  onSync,
  isSyncing,
}: Props): JSX.Element => {
  const attachedNames = useMemo(
    () => attachedRoles.map((role) => role.role_name),
    [attachedRoles],
  );

  const [selected, setSelected] = useState<string[]>(attachedNames);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setSelected(attachedNames);
  }, [attachedNames]);

  const rolesQuery = useQuery<Role[]>({
    queryKey: ['drs', 'workflow', 'roles'],
    queryFn: () => fetchRoles(),
    refetchOnWindowFocus: false,
  });

  const filtered = useMemo(() => {
    const list = rolesQuery.data ?? [];
    if (!search.trim()) return list;
    const needle = search.trim().toLowerCase();
    return list.filter((role) => role.name.toLowerCase().includes(needle));
  }, [rolesQuery.data, search]);

  const toggle = (name: string, checked: boolean) => {
    setSelected((current) =>
      checked
        ? Array.from(new Set([...current, name]))
        : current.filter((value) => value !== name),
    );
  };

  const dirty = useMemo(() => {
    if (selected.length !== attachedNames.length) return true;
    const sa = [...selected].sort();
    const sb = [...attachedNames].sort();
    return sa.some((value, index) => value !== sb[index]);
  }, [selected, attachedNames]);

  return (
    <div className="space-y-3">
      <Input
        placeholder="Filter roles…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        autoComplete="off"
      />

      <div className="max-h-56 overflow-y-auto rounded-md border">
        {rolesQuery.isLoading ? (
          <div className="p-3">
            <DrsInlineLoading size="xs" label="Loading roles…" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground p-3 text-xs">
            No role matches that search.
          </p>
        ) : (
          <ul className="divide-y">
            {filtered.map((role) => {
              const checked = selected.includes(role.name);
              return (
                <li
                  key={role.id}
                  className="hover:bg-accent flex items-start gap-3 px-2 py-2"
                >
                  <Checkbox
                    id={`task-kind-role-${role.id}`}
                    checked={checked}
                    onCheckedChange={(value) =>
                      toggle(role.name, Boolean(value))
                    }
                  />
                  <label
                    htmlFor={`task-kind-role-${role.id}`}
                    className="min-w-0 flex-1 cursor-pointer"
                  >
                    <span className="block text-xs font-medium">
                      {role.name}
                    </span>
                    {role.permissions.length > 0 ? (
                      <span className="mt-1 flex flex-wrap gap-1">
                        {role.permissions.map((permission) => (
                          <Badge
                            key={permission.id}
                            variant="outline"
                            className="text-[10px] font-normal"
                            title={permission.name}
                          >
                            {formatRolePermissionName(permission.name)}
                          </Badge>
                        ))}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-[10px]">
                        No permissions
                      </span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          {selected.length} role{selected.length === 1 ? '' : 's'} selected
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!dirty || isSyncing}
            onClick={() => setSelected(attachedNames)}
          >
            Reset
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!dirty || isSyncing}
            onClick={() => onSync(selected)}
          >
            {isSyncing ? 'Saving…' : 'Save roles'}
          </Button>
        </div>
      </div>
    </div>
  );
};
