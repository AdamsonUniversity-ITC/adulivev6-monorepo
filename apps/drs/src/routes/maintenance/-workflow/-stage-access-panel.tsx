import { DrsInlineLoading } from '@/components/drs-ui.tsx';
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
import { detachStageUser } from '../-lib/api/access/detachStageUser.ts';
import { fetchStageAccess } from '../-lib/api/access/fetchStageAccess.ts';
import { syncStageRoles } from '../-lib/api/access/syncStageRoles.ts';
import type {
  StageAccessPayload,
  StageUserAccess,
} from '../-lib/api/access/types.ts';
import type { WorkflowStage } from '../-lib/api/workflow/types.ts';
import { CreateRoleDialog } from './-create-role-dialog.tsx';
import { StageAccessRolesTab } from './-stage-access-roles-tab.tsx';
import { StageAccessUsersTab } from './-stage-access-users-tab.tsx';

type Props = {
  stage: WorkflowStage;
};

const stageAccessKey = (stageId: string | number) =>
  ['drs', 'workflow', 'stage', String(stageId), 'access'] as const;

export const StageAccessPanel = ({ stage }: Props): JSX.Element => {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [pendingDetach, setPendingDetach] = useState<StageUserAccess | null>(
    null,
  );

  const queryKey = stageAccessKey(stage.id);

  const accessQuery = useQuery<StageAccessPayload>({
    queryKey,
    queryFn: () => fetchStageAccess(stage.id),
    enabled: expanded,
    refetchOnWindowFocus: false,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const detachUserMutation = useMutation({
    mutationFn: (empNo: string) => detachStageUser(stage.id, empNo),
    onSuccess: () => {
      toast.success('Employee removed from stage.');
      setPendingDetach(null);
      invalidate();
    },
    onError: () => toast.error('Failed to remove employee.'),
  });

  const syncRolesMutation = useMutation({
    mutationFn: (roleNames: string[]) => syncStageRoles(stage.id, roleNames),
    onSuccess: () => {
      toast.success('Stage roles updated.');
      invalidate();
    },
    onError: () => toast.error('Failed to update stage roles.'),
  });

  const users = accessQuery.data?.users ?? [];
  const roles = accessQuery.data?.roles ?? [];

  const totalSummary = expanded
    ? null
    : `${users.length} employee${users.length === 1 ? '' : 's'} · ${roles.length} role${roles.length === 1 ? '' : 's'}`;

  return (
    <div className="border-t pt-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground gap-2"
        onClick={() => setExpanded((value) => !value)}
      >
        <ShieldCheck className="h-4 w-4" />
        {expanded ? 'Hide access' : 'Manage access'}
        {!expanded && totalSummary ? (
          <Badge variant="secondary" className="ml-2 font-normal">
            {totalSummary}
          </Badge>
        ) : null}
        {expanded ? (
          <ChevronUp className="ml-1 h-3 w-3" />
        ) : (
          <ChevronDown className="ml-1 h-3 w-3" />
        )}
      </Button>

      {expanded ? (
        <div className="mt-3">
          {accessQuery.isLoading ? (
            <DrsInlineLoading size="xs" label="Loading access…" />
          ) : accessQuery.isError ? (
            <p className="text-destructive text-xs">Could not load access.</p>
          ) : (
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
                <StageAccessUsersTab
                  stage={stage}
                  users={users}
                  onAttached={invalidate}
                  onRequestDetach={setPendingDetach}
                />
              </TabsContent>
              <TabsContent value="roles" className="mt-3">
                <StageAccessRolesTab
                  attachedRoles={roles}
                  onSync={(names) => syncRolesMutation.mutate(names)}
                  isSyncing={syncRolesMutation.isPending}
                />
                <div className="mt-3 border-t pt-3">
                  <CreateRoleDialog onCreated={invalidate} />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      ) : null}

      <ConfirmActionDialog
        open={pendingDetach !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDetach(null);
        }}
        title="Remove employee from stage?"
        description={
          pendingDetach ? (
            <>
              This stops{' '}
              <span className="font-medium">
                {pendingDetach.employee?.name ||
                  `employee ${pendingDetach.emp_no}`}
              </span>{' '}
              from being able to complete tasks in this stage (unless they still
              hold an attached role).
            </>
          ) : null
        }
        confirmLabel="Remove employee"
        pending={detachUserMutation.isPending}
        onConfirm={() => {
          if (pendingDetach) detachUserMutation.mutate(pendingDetach.emp_no);
        }}
      />
    </div>
  );
};
