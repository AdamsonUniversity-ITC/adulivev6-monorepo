import type { TaskKindUserAccess } from '../-lib/api/access/types.ts';
import type { AssignmentUser } from '../-lib/api/user-management/types.ts';
import type { WorkflowTask } from '../-lib/api/workflow/types.ts';

export type WorkflowAssignmentFetchParams = {
  target_type: string;
  stage_id?: string | number;
  task_id?: string | number;
  kind?: string;
  target_key?: string | number;
};

export type EffectiveAssignmentUser = {
  emp_no: string;
  assignment_role: string;
  status?: string;
};

export const isActiveAssignmentUser = (
  user: EffectiveAssignmentUser,
): boolean => user.status === undefined || user.status === 'active';

export const resolveEffectiveTaskAssignmentSources = (
  task: WorkflowTask,
): WorkflowAssignmentFetchParams[] => {
  const sources: WorkflowAssignmentFetchParams[] = [
    { target_type: 'task', task_id: task.id },
    { target_type: 'stage', stage_id: task.drs_workflow_stage_id },
  ];

  if (task.kind === 'clearance_signoff') {
    if (task.drs_clearance_id) {
      sources.push({
        target_type: 'clearance_department',
        target_key: task.drs_clearance_id,
      });
    }
  } else if (task.kind === 'assessment') {
    sources.push({ target_type: 'assessment' });
  } else {
    sources.push({ target_type: 'task_kind', kind: task.kind });
  }

  return sources;
};

export const shouldFetchTaskKindAccess = (task: WorkflowTask): boolean =>
  task.kind !== 'clearance_signoff' && task.kind !== 'assessment';

export const toEffectiveAssignmentUser = (
  user: AssignmentUser,
): EffectiveAssignmentUser => ({
  emp_no: user.emp_no,
  assignment_role: user.assignment_role,
  status: user.status,
});

export const taskKindUserToEffectiveAssignmentUser = (
  user: TaskKindUserAccess,
): EffectiveAssignmentUser => ({
  emp_no: user.emp_no,
  assignment_role: 'primary',
  status: 'active',
});

export const mergeEffectiveAssignmentUsers = (
  assignmentUsers: AssignmentUser[],
  taskKindUsers: TaskKindUserAccess[],
): EffectiveAssignmentUser[] => {
  const byEmpNo = new Map<string, EffectiveAssignmentUser>();

  for (const user of assignmentUsers.map(toEffectiveAssignmentUser)) {
    if (!isActiveAssignmentUser(user)) continue;
    if (!byEmpNo.has(user.emp_no)) {
      byEmpNo.set(user.emp_no, user);
    }
  }

  for (const user of taskKindUsers.map(taskKindUserToEffectiveAssignmentUser)) {
    if (!isActiveAssignmentUser(user)) continue;
    if (!byEmpNo.has(user.emp_no)) {
      byEmpNo.set(user.emp_no, user);
    }
  }

  return Array.from(byEmpNo.values());
};

export const countFallbackAssignmentUsers = (
  users: EffectiveAssignmentUser[],
): number => users.filter((user) => user.assignment_role === 'fallback').length;
