import type { WorkflowTaskKind } from './-lib/api/workflow/types.ts';

export type TaskKindSlideKind = Extract<
  WorkflowTaskKind,
  | 'processing'
  | 'compliance'
  | 'release'
  | 'delivery_dispatch'
  | 'pickup_handoff'
  | 'disposal'
>;

export type TaskKindSlideMeta = {
  label: string;
  description: string;
  accessDescription: string;
  readOnlyDescription: string;
};

export const TASK_KIND_SLIDE_KINDS = [
  'processing',
  'compliance',
  'release',
  'delivery_dispatch',
  'pickup_handoff',
  'disposal',
] as const satisfies readonly TaskKindSlideKind[];

export const TASK_KIND_SLIDE_META: Record<
  TaskKindSlideKind,
  TaskKindSlideMeta
> = {
  processing: {
    label: 'Processing',
    description: 'Assign employees and roles who process approved requests.',
    accessDescription:
      'Operators listed here can complete processing tasks in the staff queue. Users may also qualify via attached auth roles.',
    readOnlyDescription:
      'Use the Processing panel to manage processing operators.',
  },
  compliance: {
    label: 'Compliance',
    description: 'Assign employees and roles who review compliance tasks.',
    accessDescription:
      'Operators listed here can complete compliance tasks in the staff queue. Users may also qualify via attached auth roles.',
    readOnlyDescription:
      'Use the Compliance panel to manage compliance operators.',
  },
  release: {
    label: 'Release',
    description: 'Assign employees and roles who release completed documents.',
    accessDescription:
      'Operators listed here can complete release tasks in the staff queue. Users may also qualify via attached auth roles.',
    readOnlyDescription: 'Use the Release panel to manage release operators.',
  },
  delivery_dispatch: {
    label: 'Delivery dispatch',
    description:
      'Assign employees and roles who dispatch documents for delivery.',
    accessDescription:
      'Operators listed here can complete delivery dispatch tasks in the staff queue. Users may also qualify via attached auth roles.',
    readOnlyDescription:
      'Use the Delivery dispatch panel to manage delivery operators.',
  },
  pickup_handoff: {
    label: 'Pickup handoff',
    description:
      'Assign employees and roles who hand off documents for pickup.',
    accessDescription:
      'Operators listed here can complete pickup handoff tasks in the staff queue. Users may also qualify via attached auth roles.',
    readOnlyDescription:
      'Use the Pickup handoff panel to manage pickup operators.',
  },
  disposal: {
    label: 'Disposal',
    description: 'Assign employees and roles who dispose or archive requests.',
    accessDescription:
      'Operators listed here can complete disposal tasks in the staff queue. Users may also qualify via attached auth roles.',
    readOnlyDescription: 'Use the Disposal panel to manage disposal operators.',
  },
};

export const isTaskKindSlideKind = (
  kind: WorkflowTaskKind | string,
): kind is TaskKindSlideKind =>
  TASK_KIND_SLIDE_KINDS.includes(kind as TaskKindSlideKind);
