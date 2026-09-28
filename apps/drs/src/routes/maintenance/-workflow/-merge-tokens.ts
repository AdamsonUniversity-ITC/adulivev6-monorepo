export type DrsMergeToken = {
  key: string;
  token: string;
  purpose: string;
};

export const DRS_MERGE_TOKENS: DrsMergeToken[] = [
  {
    key: 'drs_no',
    token: '{{drs_no}}',
    purpose: 'Application reference number',
  },
  {
    key: 'status',
    token: '{{status}}',
    purpose: 'Application status key',
  },
  {
    key: 'stage_name',
    token: '{{stage_name}}',
    purpose: 'Current workflow stage name',
  },
  {
    key: 'task_name',
    token: '{{task_name}}',
    purpose: 'Triggering task name',
  },
  {
    key: 'task_kind',
    token: '{{task_kind}}',
    purpose: 'Task kind slug',
  },
];

export const EMAIL_SAMPLE_TOKEN_VALUES: Record<string, string> = {
  drs_no: 'DRS-1001',
  status: 'for_assessment',
  stage_name: 'For Assessment',
  task_name: 'Assess fees',
  task_kind: 'assessment',
};

export const AUTO_DISPOSAL_SAMPLE_TOKEN_VALUES: Record<string, string> = {
  drs_no: 'DRS-1001',
  status: 'for_processing',
  stage_name: 'For Processing',
  task_name: 'Process documents',
  task_kind: 'processing',
};

export function applyMergeTokens(
  template: string,
  samples: Record<string, string>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(samples)) {
    result = result.split(`{{${key}}}`).join(value);
  }
  return result;
}
