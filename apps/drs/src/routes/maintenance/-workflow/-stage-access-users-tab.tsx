import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { toast } from '@repo/ui/exports';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Trash2, UserPlus } from 'lucide-react';
import { JSX, useState } from 'react';
import type { WorkflowStage } from '../-lib/api/workflow/types.ts';
import { attachStageUser } from '../-lib/api/access/attachStageUser.ts';
import type { StageUserAccess } from '../-lib/api/access/types.ts';
import { searchEmployees } from '../-lib/api/employees/searchEmployees.ts';
import { useDebouncedValue } from '../-lib/hooks/useDebouncedValue.ts';

type Props = {
  stage: WorkflowStage;
  users: StageUserAccess[];
  onAttached: () => void;
  onRequestDetach: (user: StageUserAccess) => void;
};

const MIN_QUERY_LENGTH = 2;

const labelFor = (entry: StageUserAccess): string =>
  entry.employee?.name?.trim() ||
  entry.employee?.email?.trim() ||
  `Employee ${entry.emp_no}`;

const subtitleFor = (entry: StageUserAccess): string => {
  const parts = [entry.employee?.position, entry.employee?.email].filter(
    Boolean,
  );

  const base = parts.length ? parts.join(' · ') : `emp ${entry.emp_no}`;
  return entry.role_label ? `${base} · ${entry.role_label}` : base;
};

export const StageAccessUsersTab = ({
  stage,
  users,
  onAttached,
  onRequestDetach,
}: Props): JSX.Element => {
  const [search, setSearch] = useState('');
  const trimmed = search.trim();
  const debounced = useDebouncedValue(trimmed, 300);

  const empNosInRoster = new Set(users.map((u) => u.emp_no));

  const searchQuery = useQuery({
    queryKey: ['drs', 'workflow', 'access', 'employee-search', debounced],
    queryFn: () => searchEmployees(debounced),
    enabled: debounced.length >= MIN_QUERY_LENGTH,
    refetchOnWindowFocus: false,
  });

  const attachMutation = useMutation({
    mutationFn: (empNo: string) =>
      attachStageUser(stage.id, { emp_no: empNo }),
    onSuccess: () => {
      toast.success('Employee added to stage.');
      onAttached();
      setSearch('');
    },
    onError: () => toast.error('Failed to add employee.'),
  });

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label
          htmlFor={`stage-${stage.id}-employee-search`}
          className="text-foreground text-xs font-medium"
        >
          Add employee
        </label>
        <Input
          id={`stage-${stage.id}-employee-search`}
          placeholder="Search by name, emp no, or email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          autoComplete="off"
        />
        {trimmed.length >= MIN_QUERY_LENGTH ? (
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-1">
            {searchQuery.isFetching ? (
              <p className="text-muted-foreground p-2 text-xs">Searching…</p>
            ) : (searchQuery.data ?? []).length === 0 ? (
              <p className="text-muted-foreground p-2 text-xs">
                No matches found.
              </p>
            ) : (
              (searchQuery.data ?? []).map((hit) => {
                const alreadyIn = empNosInRoster.has(hit.emp_no);
                return (
                  <button
                    key={hit.emp_no}
                    type="button"
                    className="hover:bg-accent flex w-full flex-col rounded-md px-2 py-2 text-left text-xs disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => attachMutation.mutate(hit.emp_no)}
                    disabled={alreadyIn || attachMutation.isPending}
                  >
                    <span className="font-medium">
                      {hit.name || 'Unnamed'}{' '}
                      <span className="text-muted-foreground font-normal">
                        ({hit.emp_no})
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      {[hit.position, hit.email].filter(Boolean).join(' · ') ||
                        '—'}
                      {alreadyIn ? ' · already added' : ''}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        ) : null}
      </div>

      <div>
        <p className="text-muted-foreground text-xs">
          Roster ({users.length})
        </p>
        {users.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-xs">
            No employees assigned. Add one above or rely on attached roles.
          </p>
        ) : (
          <ul className="mt-2 space-y-1">
            {users.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-md border px-2 py-1.5 text-xs"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{labelFor(entry)}</span>
                  <span className="text-muted-foreground truncate">
                    {subtitleFor(entry)}
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label="Remove employee"
                  onClick={() => onRequestDetach(entry)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {attachMutation.isPending ? (
        <p className="text-muted-foreground flex items-center gap-2 text-xs">
          <UserPlus className="h-3 w-3" />
          Adding employee…
        </p>
      ) : null}
    </div>
  );
};
