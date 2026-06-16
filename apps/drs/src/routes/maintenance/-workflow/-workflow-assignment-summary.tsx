import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { useQuery } from '@tanstack/react-query';
import { JSX, useMemo } from 'react';
import { fetchWorkflowAssignments } from '../-lib/api/user-management/fetchWorkflowAssignments.ts';
import { useMaintenanceNavigation } from '../-maintenance-navigation-context.tsx';

type Target =
  | { target_type: 'stage'; stage_id: string | number; label: string }
  | { target_type: 'task'; task_id: string | number; label: string }
  | { target_type: 'task_kind'; kind: string; label: string };

const assignmentKey = (target: Target) =>
  [
    'drs',
    'workflow',
    'assignments',
    target.target_type,
    'stage_id' in target ? target.stage_id : null,
    'task_id' in target ? target.task_id : null,
    'kind' in target ? target.kind : null,
  ] as const;

export function WorkflowAssignmentSummary({
  target,
}: {
  target: Target;
}): JSX.Element {
  const { openUserManagement } = useMaintenanceNavigation();
  const query = useQuery({
    queryKey: assignmentKey(target),
    queryFn: () =>
      fetchWorkflowAssignments({
        target_type: target.target_type,
        stage_id: 'stage_id' in target ? target.stage_id : undefined,
        task_id: 'task_id' in target ? target.task_id : undefined,
        kind: 'kind' in target ? target.kind : undefined,
      }),
    refetchOnWindowFocus: false,
  });

  const users = useMemo(
    () => (query.data ?? []).flatMap((assignment) => assignment.users),
    [query.data],
  );
  const fallbackCount = users.filter(
    (user) => user.assignment_role === 'fallback',
  ).length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="secondary" className="font-normal">
        {users.length} assigned
      </Badge>
      {fallbackCount > 0 ? (
        <Badge variant="outline" className="font-normal">
          {fallbackCount} fallback
        </Badge>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7"
        onClick={openUserManagement}
      >
        Manage in User Management
      </Button>
    </div>
  );
}
