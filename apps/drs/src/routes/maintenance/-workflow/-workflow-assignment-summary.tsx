import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { useQuery } from '@tanstack/react-query';
import { JSX, useMemo } from 'react';
import { fetchTaskKindAccess } from '../-lib/api/access/fetchTaskKindAccess.ts';
import { fetchWorkflowAssignments } from '../-lib/api/user-management/fetchWorkflowAssignments.ts';
import type { WorkflowAssignment } from '../-lib/api/user-management/types.ts';
import type { WorkflowTask } from '../-lib/api/workflow/types.ts';
import { useMaintenanceNavigation } from '../-maintenance-navigation-context.tsx';
import {
  countFallbackAssignmentUsers,
  mergeEffectiveAssignmentUsers,
  resolveEffectiveTaskAssignmentSources,
  shouldFetchTaskKindAccess,
  usersFromAssignmentParams,
  type WorkflowAssignmentFetchParams,
} from './-assignment-utils.ts';
import { ASSIGNMENTS_ALL_QUERY_KEY } from './-utils.ts';

type Target =
  | { target_type: 'stage'; stage_id: string | number; label: string }
  | { target_type: 'task'; task_id: string | number; label: string }
  | { target_type: 'task_kind'; kind: string; label: string }
  | { target_type: 'effective_task'; task: WorkflowTask; label: string };

const taskKindAccessKey = (kind: string) =>
  ['drs', 'workflow', 'task-kind', kind, 'access'] as const;

function SimpleAssignmentSummary({
  users,
  fallbackCount,
  onManage,
}: {
  users: { emp_no: string }[];
  fallbackCount: number;
  onManage: () => void;
}): JSX.Element {
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
        onClick={onManage}
      >
        Manage in User Management
      </Button>
    </div>
  );
}

function useSharedAssignments() {
  return useQuery({
    queryKey: ASSIGNMENTS_ALL_QUERY_KEY,
    queryFn: () => fetchWorkflowAssignments(),
    refetchOnWindowFocus: false,
  });
}

function usersForTargetParams(
  assignments: WorkflowAssignment[] | undefined,
  params: WorkflowAssignmentFetchParams,
) {
  return usersFromAssignmentParams(assignments ?? [], params);
}

function EffectiveTaskAssignmentSummary({
  task,
}: {
  task: WorkflowTask;
}): JSX.Element {
  const { openUserManagement } = useMaintenanceNavigation();
  const assignmentsQuery = useSharedAssignments();
  const sources = useMemo(
    () => resolveEffectiveTaskAssignmentSources(task),
    [task],
  );
  const includeTaskKindAccess = shouldFetchTaskKindAccess(task);

  // Summaries never fetch access; they only merge cached panel data when present.
  const taskKindAccessQuery = useQuery({
    queryKey: taskKindAccessKey(task.kind),
    queryFn: () => fetchTaskKindAccess(task.kind),
    enabled: false,
    refetchOnWindowFocus: false,
  });

  const users = useMemo(() => {
    const assignmentUsers = sources.flatMap((params) =>
      usersForTargetParams(assignmentsQuery.data, params),
    );
    const taskKindUsers = includeTaskKindAccess
      ? (taskKindAccessQuery.data?.users ?? [])
      : [];

    return mergeEffectiveAssignmentUsers(assignmentUsers, taskKindUsers);
  }, [
    assignmentsQuery.data,
    includeTaskKindAccess,
    sources,
    taskKindAccessQuery.data,
  ]);

  const fallbackCount = countFallbackAssignmentUsers(users);

  return (
    <SimpleAssignmentSummary
      users={users}
      fallbackCount={fallbackCount}
      onManage={openUserManagement}
    />
  );
}

function DirectAssignmentSummary({
  params,
}: {
  params: WorkflowAssignmentFetchParams;
}): JSX.Element {
  const { openUserManagement } = useMaintenanceNavigation();
  const assignmentsQuery = useSharedAssignments();

  const users = useMemo(
    () => usersForTargetParams(assignmentsQuery.data, params),
    [
      assignmentsQuery.data,
      params.target_type,
      params.stage_id,
      params.task_id,
      params.kind,
      params.target_key,
    ],
  );
  const fallbackCount = users.filter(
    (user) => user.assignment_role === 'fallback',
  ).length;

  return (
    <SimpleAssignmentSummary
      users={users}
      fallbackCount={fallbackCount}
      onManage={openUserManagement}
    />
  );
}

export function WorkflowAssignmentSummary({
  target,
}: {
  target: Target;
}): JSX.Element {
  if (target.target_type === 'effective_task') {
    return <EffectiveTaskAssignmentSummary task={target.task} />;
  }

  return (
    <DirectAssignmentSummary
      params={{
        target_type: target.target_type,
        stage_id: 'stage_id' in target ? target.stage_id : undefined,
        task_id: 'task_id' in target ? target.task_id : undefined,
        kind: 'kind' in target ? target.kind : undefined,
      }}
    />
  );
}
