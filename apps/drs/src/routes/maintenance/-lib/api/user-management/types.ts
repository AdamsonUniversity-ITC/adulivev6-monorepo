import type { Employee } from '../employees/types.ts';

export type ResponsibilitySummary = {
  total: number;
  by_role: Record<string, number>;
  by_target: Record<string, number>;
};

export type UserManagementRow = Employee & {
  responsibility_summary: ResponsibilitySummary;
};

export type UserManagementProfile = {
  employee: Employee;
  roles: string[];
  permissions: string[];
  responsibility_summary: ResponsibilitySummary;
  responsibilities: WorkflowResponsibility[];
};

export type WorkflowResponsibility = {
  id: string;
  assignment_id?: string;
  assignment_role: string;
  sequence: number;
  target_type: string | null;
  target_key?: string | null;
  target_name?: string | null;
  kind: string | null;
  stage: { id: string; name: string; slug: string } | null;
  task: { id: string; name: string; kind: string } | null;
  metadata: Record<string, unknown>;
};

export type AssignmentUser = {
  id: string;
  emp_no: string;
  assignment_role: string;
  sequence: number;
  status: string;
  metadata: Record<string, unknown>;
  employee?: Employee | null;
};

export type WorkflowAssignment = {
  id: string;
  target_type: string;
  target_key: string | null;
  kind: string | null;
  drs_workflow_stage_id: string | null;
  drs_workflow_task_id: string | null;
  name: string | null;
  users: AssignmentUser[];
};

export type UserManagementListResponse = {
  data: UserManagementRow[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type AssignmentPayload = {
  target_type:
    | 'task_kind'
    | 'stage'
    | 'task'
    | 'approval_chain'
    | 'clearance_department'
    | 'assessment'
    | 'assessment_foreigner';
  target_key?: string | number | null;
  clearance_id?: string | number | null;
  assessment_setting_id?: string | number | null;
  kind?: string | null;
  stage_id?: string | number | null;
  task_id?: string | number | null;
  name?: string | null;
  emp_no: string;
  assignment_role?: 'primary' | 'fallback' | 'approver';
  sequence?: number;
  metadata?: Record<string, unknown>;
};
