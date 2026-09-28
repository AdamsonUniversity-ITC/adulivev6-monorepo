import type { WorkflowTaskKind } from './-lib/api/workflow/types.ts';

export type TaskKindSlideKind = Extract<
  WorkflowTaskKind,
  'processing' | 'release' | 'delivery_dispatch' | 'pickup_handoff'
>;

export type TaskKindSlideMeta = {
  label: string;
  description: string;
  accessDescription: string;
  readOnlyDescription: string;
};

export const TASK_KIND_SLIDE_KINDS = [
  'processing',
  'release',
  'delivery_dispatch',
  'pickup_handoff',
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
};

export const isTaskKindSlideKind = (
  kind: WorkflowTaskKind | string,
): kind is TaskKindSlideKind =>
  TASK_KIND_SLIDE_KINDS.includes(kind as TaskKindSlideKind);
