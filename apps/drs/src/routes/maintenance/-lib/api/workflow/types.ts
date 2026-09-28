export type WorkflowTaskKind =
  | 'clearance_signoff'
  | 'assessment'
  | 'payment_collection'
  | 'payment_verification'
  | 'processing'
  | 'release'
  | 'compliance'
  | 'delivery_dispatch'
  | 'pickup_handoff'
  | 'disposal'
  | 'manual';

export type WorkflowTask = {
  id: string;
  drs_workflow_stage_id: string;
  name: string;
  slug: string;
  kind: WorkflowTaskKind;
  is_required: boolean;
  position: number;
  parallel_group: string | null;
  drs_clearance_id: string | null;
  config_json: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
};

export type WorkflowTransitionStageSummary = {
  id: string;
  name: string;
  slug: string;
  position: number;
  is_terminal: boolean;
};

export type WorkflowTransitionTaskSummary = {
  id: string;
  name: string;
  slug: string;
  kind: WorkflowTaskKind;
};

export type WorkflowTransition = {
  id: string;
  system_id: string;
  from_stage_id: string;
  to_stage_id: string;
  trigger_task_id: string | null;
  label: string;
  outcome_key: string;
  position: number;
  is_active: boolean;
  is_default: boolean;
  target_stage?: WorkflowTransitionStageSummary | null;
  trigger_task?: WorkflowTransitionTaskSummary | null;
  created_at?: string;
  updated_at?: string;
};

export type WorkflowStage = {
  id: string;
  name: string;
  slug: string;
  position: number;
  is_initial: boolean;
  is_terminal: boolean;
  color: string | null;
  transition_rule: 'all_required_done' | 'any_done';
  restrict_assigned_users_to_course_programs: boolean;
  allows_owner_cancellation: boolean;
  allows_staff_receive_mode_change: boolean;
  tasks: WorkflowTask[];
  transitions?: WorkflowTransition[];
  created_at?: string;
  updated_at?: string;
};

export type WorkflowKind = {
  kind: WorkflowTaskKind;
  label: string;
  description: string;
  requires_clearance: boolean;
  config_schema: Record<
    string,
    {
      type: string;
      min?: number;
      default?: unknown;
      nullable?: boolean;
      options?: string[];
    }
  >;
};

export type EmailNotificationTargetType = 'stage' | 'task_kind';
export type EmailNotificationCondition = 'into' | 'out_of';

export type EmailNotificationConfig = {
  id: string;
  system_id: string;
  name: string;
  target_type: EmailNotificationTargetType;
  drs_workflow_stage_id: string | null;
  stage_name?: string | null;
  task_kind: WorkflowTaskKind | null;
  condition: EmailNotificationCondition;
  notify_student: boolean;
  notify_staff: boolean;
  subject: string;
  body_html: string;
  is_enabled: boolean;
  created_at?: string;
  updated_at?: string;
};

export type AutoDisposalTargetType = 'stage' | 'task_kind';

export type AutoDisposalConfig = {
  id: string;
  system_id: string;
  name: string;
  target_type: AutoDisposalTargetType;
  drs_workflow_stage_id: string | null;
  stage_name?: string | null;
  task_kind: WorkflowTaskKind | null;
  dispose_after_working_days: number;
  notify_before_working_days: number;
  subject: string;
  body_html: string;
  is_enabled: boolean;
  created_at?: string;
  updated_at?: string;
};

export type AutoFetchTargetType = 'stage' | 'task_kind';
export type AutoFetchSource =
  | 'student_balance'
  | 'unreturned_books'
  | 'osl_violations'
  | 'tbi_holds'
  | 'probationary';
export type AutoFetchAction = 'row_color' | 'row_flag';
export type AutoFetchTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';
export type AutoFetchRowColorOp = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';

export type AutoFetchThresholdRule = {
  op: AutoFetchRowColorOp;
  amount: number;
  tone?: AutoFetchTone;
  label?: string | null;
  icon?: string | null;
};

export type AutoFetchActionConfig = {
  rules: AutoFetchThresholdRule[];
  fallback_tone?: AutoFetchTone;
};

export type AutoFetchConfig = {
  id: string;
  system_id: string;
  name: string;
  target_type: AutoFetchTargetType;
  drs_workflow_stage_id: string | null;
  stage_name?: string | null;
  task_kind: WorkflowTaskKind | null;
  source: AutoFetchSource;
  action: AutoFetchAction;
  action_config_json: AutoFetchActionConfig;
  run_at_time: string;
  is_enabled: boolean;
  created_at?: string;
  updated_at?: string;
};
