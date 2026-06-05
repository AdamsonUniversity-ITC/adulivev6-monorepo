export type DRSApplicationClearedRef = {
  type: string;
  id: string;
} | null;

export type DRSApplicationLineRow = {
  id: string;
  request_type: 'document' | 'package' | null;
  /** Present on detail/show payloads for PATCH round-trips */
  requestable_id?: string;
  request_name: string;
  quantity: number;
};

export type DRSApplicationClearanceRow = {
  id: string;
  drs_clearance_id: string;
  clearance_name: string;
  status: 'pending' | 'cleared' | string;
  cleared_at: string | null;
  remarks: string | null;
};

export type DRSApplicationStagePayload = {
  id: string;
  name: string;
  slug: string;
  position: number;
  is_terminal: boolean;
};

export type DRSApplicationMessageRow = {
  id: string;
  body: string;
  user_id: number;
  is_registrar: boolean;
  created_at: string | null;
};

export type DRSActiveStageTask = {
  id: string;
  task_id: string;
  name?: string | null;
  kind?: string | null;
  stage_id?: string;
  is_required: boolean;
  allow_remarks?: boolean;
  status: string;
  completed_at?: string | null;
  due_at?: string | null;
  may_complete?: boolean;
};

export type DRSApplicationRow = {
  id: string;
  drs_no: string | null;
  student_no: string;
  /** Present when API eager-loads `student` (e.g. list + detail). */
  student_name?: string;
  course_id: string;
  school_year: string;
  semester: string;
  contact_no: string;
  email: string;
  receive_mode: 'email' | 'delivery' | 'pickup';
  delivery_address: string | null;
  delivery_tracking_number: string | null;
  purpose: string | null;
  remarks: string | null;
  is_paid: boolean;
  is_cancelled: boolean;
  release_date: string | null;
  date_released: string | null;
  cleared: DRSApplicationClearedRef;
  status: string;
  lines?: DRSApplicationLineRow[];
  clearances?: DRSApplicationClearanceRow[];
  current_stage?: DRSApplicationStagePayload | null;
  created_at: string | null;
  updated_at: string | null;
};

export type DRSApplicationDetail = DRSApplicationRow & {
  editable?: boolean;
  current_stage?: DRSApplicationStagePayload | null;
  stage_runs?: Array<{
    id: string;
    stage_id: string;
    stage_name?: string | null;
    stage_slug?: string | null;
    status: string;
    started_at?: string | null;
    completed_at?: string | null;
  }>;
  tasks?: Array<{
    id: string;
    task_id: string;
    name?: string | null;
    kind?: string | null;
    stage_id: string;
    is_required: boolean;
    status: string;
    assignee_user_id?: number | null;
    completed_at?: string | null;
    due_at?: string | null;
    may_complete?: boolean;
  }>;
  active_stage_tasks?: DRSActiveStageTask[];
};

export function displayApplicationRef(row: {
  id: string;
  drs_no: string | null;
}): string {
  return row.drs_no ?? row.id;
}
