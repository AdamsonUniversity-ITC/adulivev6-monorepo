import type {
  WorkflowStage,
  WorkflowTask,
  WorkflowTransition,
} from '../-lib/api/workflow/types.ts';

export const STAGES_QUERY_KEY = ['workflow_stages'];
export const KINDS_QUERY_KEY = ['workflow_task_kinds'];
export const CLEARANCES_QUERY_KEY = ['clearance_departments'];

export const sortedTasks = (
  tasks: WorkflowTask[] | undefined,
): WorkflowTask[] =>
  (tasks ?? []).slice().sort((a, b) => a.position - b.position);

export const sortedStages = (
  stages: WorkflowStage[] | undefined,
): WorkflowStage[] =>
  (stages ?? []).slice().sort((a, b) => a.position - b.position);

export const sortedTransitions = (
  transitions: WorkflowTransition[] | undefined,
): WorkflowTransition[] =>
  (transitions ?? []).slice().sort((a, b) => a.position - b.position);

export const moveItem = <T>(items: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= items.length) return items;
  const next = items.slice();
  const [moved] = next.splice(from, 1);
  if (!moved) return items;
  next.splice(to, 0, moved);
  return next;
};

export type ClearanceOption = {
  id: number | string;
  clearance_name?: string | null;
  department_name?: string | null;
  name?: string | null;
};

export const getClearanceLabel = (option: ClearanceOption): string =>
  option.clearance_name ??
  option.department_name ??
  option.name ??
  `Clearance #${option.id}`;
