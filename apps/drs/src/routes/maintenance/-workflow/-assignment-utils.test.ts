import { describe, expect, it } from 'vitest';
import type { TaskKindUserAccess } from '../-lib/api/access/types.ts';
import type { AssignmentUser } from '../-lib/api/user-management/types.ts';
import type { WorkflowTask } from '../-lib/api/workflow/types.ts';
import {
  countFallbackAssignmentUsers,
  isActiveAssignmentUser,
  mergeEffectiveAssignmentUsers,
  resolveEffectiveTaskAssignmentSources,
  shouldFetchTaskKindAccess,
} from './-assignment-utils.ts';

const baseTask = (overrides: Partial<WorkflowTask> = {}): WorkflowTask => ({
  id: '10',
  drs_workflow_stage_id: '5',
  name: 'Process application',
  slug: 'process-application',
  kind: 'processing',
  is_required: true,
  position: 1,
  parallel_group: null,
  drs_clearance_id: null,
  config_json: null,
  ...overrides,
});

const assignmentUser = (
  overrides: Partial<AssignmentUser> = {},
): AssignmentUser => ({
  id: '1',
  emp_no: 'EMP-1',
  assignment_role: 'primary',
  sequence: 0,
  status: 'active',
  metadata: {},
  ...overrides,
});

const taskKindUser = (
  overrides: Partial<TaskKindUserAccess> = {},
): TaskKindUserAccess => ({
  id: '1',
  kind: 'processing',
  emp_no: 'EMP-2',
  role_label: null,
  ...overrides,
});

describe('resolveEffectiveTaskAssignmentSources', () => {
  it('includes task, stage, and task_kind for standard tasks', () => {
    const task = baseTask();

    expect(resolveEffectiveTaskAssignmentSources(task)).toEqual([
      { target_type: 'task', task_id: '10' },
      { target_type: 'stage', stage_id: '5' },
      { target_type: 'task_kind', kind: 'processing' },
    ]);
  });

  it('uses clearance department for clearance sign-off tasks', () => {
    const task = baseTask({
      kind: 'clearance_signoff',
      drs_clearance_id: '3',
    });

    expect(resolveEffectiveTaskAssignmentSources(task)).toEqual([
      { target_type: 'task', task_id: '10' },
      { target_type: 'stage', stage_id: '5' },
      { target_type: 'clearance_department', target_key: '3' },
    ]);
  });

  it('uses assessment target for assessment tasks', () => {
    const task = baseTask({ kind: 'assessment' });

    expect(resolveEffectiveTaskAssignmentSources(task)).toEqual([
      { target_type: 'task', task_id: '10' },
      { target_type: 'stage', stage_id: '5' },
      { target_type: 'assessment' },
    ]);
  });
});

describe('shouldFetchTaskKindAccess', () => {
  it('returns false for clearance and assessment kinds', () => {
    expect(
      shouldFetchTaskKindAccess(baseTask({ kind: 'clearance_signoff' })),
    ).toBe(false);
    expect(shouldFetchTaskKindAccess(baseTask({ kind: 'assessment' }))).toBe(
      false,
    );
  });

  it('returns true for other kinds', () => {
    expect(shouldFetchTaskKindAccess(baseTask({ kind: 'processing' }))).toBe(
      true,
    );
  });
});

describe('mergeEffectiveAssignmentUsers', () => {
  it('dedupes the same employee from multiple assignment sources', () => {
    const merged = mergeEffectiveAssignmentUsers(
      [
        assignmentUser({ emp_no: 'EMP-1', assignment_role: 'primary' }),
        assignmentUser({
          id: '2',
          emp_no: 'EMP-1',
          assignment_role: 'fallback',
        }),
      ],
      [taskKindUser({ emp_no: 'EMP-1' })],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]?.emp_no).toBe('EMP-1');
    expect(merged[0]?.assignment_role).toBe('primary');
  });

  it('excludes inactive assignment users', () => {
    const merged = mergeEffectiveAssignmentUsers(
      [
        assignmentUser({ emp_no: 'EMP-1', status: 'inactive' }),
        assignmentUser({ id: '2', emp_no: 'EMP-2', status: 'active' }),
      ],
      [],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]?.emp_no).toBe('EMP-2');
  });

  it('includes task kind roster users not present in assignments', () => {
    const merged = mergeEffectiveAssignmentUsers(
      [assignmentUser({ emp_no: 'EMP-1' })],
      [taskKindUser({ emp_no: 'EMP-3' })],
    );

    expect(merged.map((user) => user.emp_no)).toEqual(['EMP-1', 'EMP-3']);
  });
});

describe('countFallbackAssignmentUsers', () => {
  it('counts fallback roles after merge', () => {
    const merged = mergeEffectiveAssignmentUsers(
      [
        assignmentUser({ emp_no: 'EMP-1', assignment_role: 'fallback' }),
        assignmentUser({
          id: '2',
          emp_no: 'EMP-2',
          assignment_role: 'primary',
        }),
      ],
      [],
    );

    expect(countFallbackAssignmentUsers(merged)).toBe(1);
  });
});

describe('isActiveAssignmentUser', () => {
  it('treats missing status as active', () => {
    expect(
      isActiveAssignmentUser({ emp_no: 'EMP-1', assignment_role: 'primary' }),
    ).toBe(true);
  });
});
