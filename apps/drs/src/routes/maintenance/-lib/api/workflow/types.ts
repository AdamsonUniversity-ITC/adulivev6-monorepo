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

export type WorkflowStage = {
  id: string;
  name: string;
  slug: string;
  position: number;
  is_initial: boolean;
  is_terminal: boolean;
  color: string | null;
  transition_rule: 'all_required_done' | 'any_done';
  tasks: WorkflowTask[];
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
