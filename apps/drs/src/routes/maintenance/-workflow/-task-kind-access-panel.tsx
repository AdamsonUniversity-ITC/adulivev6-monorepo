import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs';
import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { JSX, useState } from 'react';
import { ConfirmActionDialog } from '../-clearance/-confirm-action-dialog.tsx';
import { detachTaskKindUser } from '../-lib/api/access/detachTaskKindUser.ts';
import { fetchTaskKindAccess } from '../-lib/api/access/fetchTaskKindAccess.ts';
import { syncTaskKindRoles } from '../-lib/api/access/syncTaskKindRoles.ts';
import type {
  TaskKindAccessPayload,
  TaskKindUserAccess,
} from '../-lib/api/access/types.ts';
import { TaskKindAccessRolesTab } from './-task-kind-access-roles-tab.tsx';
import { TaskKindAccessUsersTab } from './-task-kind-access-users-tab.tsx';

type Props = {
  kind: string;
  title: string;
  readOnly?: boolean;
  readOnlyDescription?: string;
  /** When true, loads access immediately and shows tabs without the collapsible header. */
  defaultExpanded?: boolean;
  allowRoles?: boolean;
};

const taskKindAccessKey = (kind: string) =>
  ['drs', 'workflow', 'task-kind', kind, 'access'] as const;

export const TaskKindAccessPanel = ({
  kind,
  title,
  readOnly = false,
  readOnlyDescription,
  defaultExpanded = false,
  allowRoles = true,
}: Props): JSX.Element => {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [pendingDetach, setPendingDetach] = useState<TaskKindUserAccess | null>(
    null,
  );

  const queryKey = taskKindAccessKey(kind);

  const accessQuery = useQuery<TaskKindAccessPayload>({
    queryKey,
    queryFn: () => fetchTaskKindAccess(kind),
    enabled: expanded || defaultExpanded || readOnly,
    refetchOnWindowFocus: false,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const detachUserMutation = useMutation({
    mutationFn: (empNo: string) => detachTaskKindUser(kind, empNo),
    onSuccess: () => {
      toast.success('Employee removed.');
      setPendingDetach(null);
      invalidate();
    },
    onError: () => toast.error('Failed to remove employee.'),
  });

  const syncRolesMutation = useMutation({
    mutationFn: (roleNames: string[]) => syncTaskKindRoles(kind, roleNames),
    onSuccess: () => {
      toast.success('Roles updated.');
      invalidate();
    },
    onError: () => toast.error('Failed to update roles.'),
  });

  const users = accessQuery.data?.users ?? [];
  const roles = accessQuery.data?.roles ?? [];
  const employeeCount = `${users.length} employee${users.length === 1 ? '' : 's'}`;

  const totalSummary = expanded
    ? null
    : allowRoles
      ? `${employeeCount} · ${roles.length} role${roles.length === 1 ? '' : 's'}`
      : employeeCount;

  const usersTab = (
    <TaskKindAccessUsersTab
      kind={kind}
      users={users}
      onAttached={invalidate}
      onRequestDetach={setPendingDetach}
      emptyRosterDescription={
        allowRoles
          ? undefined
          : 'No employees assigned. Add one above to grant access.'
      }
      readOnly={readOnly}
    />
  );

  const accessBody = accessQuery.isLoading ? (
    <p className="text-muted-foreground text-xs">Loading access…</p>
  ) : accessQuery.isError ? (
    <p className="text-destructive text-xs">Could not load access.</p>
  ) : (
    <>
      {allowRoles ? (
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="w-full justify-start" variant="line">
            <TabsTrigger value="users">
              Employees
              <Badge variant="secondary" className="ml-2 font-normal">
                {users.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="roles">
              Roles
              <Badge variant="secondary" className="ml-2 font-normal">
                {roles.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-3">
            {usersTab}
          </TabsContent>
          <TabsContent value="roles" className="mt-3">
            <TaskKindAccessRolesTab
              attachedRoles={roles}
              onSync={(names) => syncRolesMutation.mutate(names)}
              isSyncing={syncRolesMutation.isPending}
            />
          </TabsContent>
        </Tabs>
      ) : (
        usersTab
      )}
    </>
  );

  const detachDialog = (
    <ConfirmActionDialog
      open={pendingDetach !== null}
      onOpenChange={(open) => {
        if (!open) setPendingDetach(null);
      }}
      title="Remove employee?"
      description={
        pendingDetach ? (
          <>
            This stops{' '}
            <span className="font-medium">
              {pendingDetach.employee?.name ||
                `employee ${pendingDetach.emp_no}`}
            </span>{' '}
            from completing <span className="font-medium">{title}</span> tasks
            {allowRoles ? ' (unless they still hold an attached role).' : '.'}
          </>
        ) : null
      }
      confirmLabel="Remove employee"
      pending={detachUserMutation.isPending}
      onConfirm={() => {
        if (pendingDetach) detachUserMutation.mutate(pendingDetach.emp_no);
      }}
    />
  );

  if (readOnly) {
    return (
      <div className="border-muted/60 bg-muted/20 space-y-3 rounded-md border px-3 py-2 text-xs">
        <p className="text-muted-foreground">
          <span className="text-foreground font-medium">{title}</span>
          {readOnlyDescription ? ` — ${readOnlyDescription}` : null}
        </p>
        {accessQuery.isLoading ? (
          <p className="text-muted-foreground">Loading roster…</p>
        ) : accessQuery.isError ? (
          <p className="text-destructive">Could not load roster.</p>
        ) : (
          usersTab
        )}
      </div>
    );
  }

  if (defaultExpanded) {
    return (
      <div className="space-y-4">
        {accessBody}
        {detachDialog}
      </div>
    );
  }

  const isOpen = expanded;

  return (
    <div className="border-muted/60 rounded-md border px-3 py-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground gap-2"
        onClick={() => setExpanded((value) => !value)}
      >
        <ShieldCheck className="h-4 w-4" />
        <span className="text-foreground font-medium">{title}</span>
        <span className="text-muted-foreground font-normal">({kind})</span>
        {!isOpen && totalSummary ? (
          <Badge variant="secondary" className="ml-2 font-normal">
            {totalSummary}
          </Badge>
        ) : null}
        {isOpen ? (
          <ChevronUp className="ml-1 h-3 w-3" />
        ) : (
          <ChevronDown className="ml-1 h-3 w-3" />
        )}
      </Button>

      {isOpen ? <div className="mt-3">{accessBody}</div> : null}

      {detachDialog}
    </div>
  );
};
