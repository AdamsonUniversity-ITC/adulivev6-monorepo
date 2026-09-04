import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { useQueries, useQuery } from '@tanstack/react-query';
import { JSX, useMemo } from 'react';
import { fetchTaskKindAccess } from '../-lib/api/access/fetchTaskKindAccess.ts';
import { fetchWorkflowAssignments } from '../-lib/api/user-management/fetchWorkflowAssignments.ts';
import type { WorkflowTask } from '../-lib/api/workflow/types.ts';
import { useMaintenanceNavigation } from '../-maintenance-navigation-context.tsx';
import {
  countFallbackAssignmentUsers,
  mergeEffectiveAssignmentUsers,
  resolveEffectiveTaskAssignmentSources,
  shouldFetchTaskKindAccess,
  type WorkflowAssignmentFetchParams,
} from './-assignment-utils.ts';

type Target =
  | { target_type: 'stage'; stage_id: string | number; label: string }
  | { target_type: 'task'; task_id: string | number; label: string }
  | { target_type: 'task_kind'; kind: string; label: string }
  | { target_type: 'effective_task'; task: WorkflowTask; label: string };

const assignmentKey = (target: Target) =>
  [
    'drs',
    'workflow',
    'assignments',
    target.target_type,
    'stage_id' in target ? target.stage_id : null,
    'task_id' in target ? target.task_id : null,
    'kind' in target ? target.kind : null,
    'task' in target ? target.task.id : null,
  ] as const;

const assignmentSourceKey = (params: WorkflowAssignmentFetchParams) =>
  [
    'drs',
    'workflow',
    'assignments',
    params.target_type,
    params.stage_id ?? null,
    params.task_id ?? null,
    params.kind ?? null,
    params.target_key ?? null,
  ] as const;

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

function EffectiveTaskAssignmentSummary({
  task,
}: {
  task: WorkflowTask;
}): JSX.Element {
  const { openUserManagement } = useMaintenanceNavigation();
  const sources = useMemo(
    () => resolveEffectiveTaskAssignmentSources(task),
    [task],
  );
  const includeTaskKindAccess = shouldFetchTaskKindAccess(task);

  const assignmentQueries = useQueries({
    queries: sources.map((params) => ({
      queryKey: assignmentSourceKey(params),
      queryFn: () => fetchWorkflowAssignments(params),
      refetchOnWindowFocus: false,
    })),
  });

  const taskKindAccessQuery = useQuery({
    queryKey: taskKindAccessKey(task.kind),
    queryFn: () => fetchTaskKindAccess(task.kind),
    enabled: includeTaskKindAccess,
    refetchOnWindowFocus: false,
  });

  const assignmentData = assignmentQueries.map((query) => query.data);

  const users = useMemo(() => {
    const assignmentUsers = assignmentData.flatMap(
      (data) => data?.flatMap((assignment) => assignment.users) ?? [],
    );
    const taskKindUsers = includeTaskKindAccess
      ? (taskKindAccessQuery.data?.users ?? [])
      : [];

    return mergeEffectiveAssignmentUsers(assignmentUsers, taskKindUsers);
  }, [assignmentData, includeTaskKindAccess, taskKindAccessQuery.data]);

  const fallbackCount = countFallbackAssignmentUsers(users);

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
  const { openUserManagement } = useMaintenanceNavigation();

  if (target.target_type === 'effective_task') {
    return <EffectiveTaskAssignmentSummary task={target.task} />;
  }

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
    <SimpleAssignmentSummary
      users={users}
      fallbackCount={fallbackCount}
      onManage={openUserManagement}
    />
  );
}
