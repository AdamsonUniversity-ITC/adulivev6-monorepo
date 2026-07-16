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
  assessed_unit_price?: number | null;
  supporting_document_requirements?: DRSApplicationSupportingRequirement[];
};

export type DRSApplicationSupportingFile = {
  id: string;
  name: string;
  file_name: string;
  mime_type: string | null;
  size: number;
  url: string;
  expires_at?: string | null;
  created_at: string | null;
};

export type DRSApplicationMessageAttachment = DRSApplicationSupportingFile & {
  expires_at?: string | null;
};

export type DRSApplicationSupportingRequirement = {
  id: string;
  catalog_requirement_id: string | null;
  name: string;
  instructions?: string | null;
  is_required: boolean;
  allowed_mime_types?: string[] | null;
  max_file_size_kb?: number | null;
  max_files?: number | null;
  status: string;
  requested_at?: string | null;
  fulfilled_at?: string | null;
  files: DRSApplicationSupportingFile[];
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
  attachments?: DRSApplicationMessageAttachment[];
  sender?: {
    first_name: string;
    name: string;
    avatar_id: number | string | null;
    avatar_type: 'teacher' | 'college' | string;
  } | null;
  created_at: string | null;
};

export type DRSPaymentVerificationTaskConfig = {
  require_reference_number?: boolean;
};

export type DRSPaymentSubmission = {
  reference_number: string | null;
  remarks: string | null;
  bank_account_id: string | null;
  bank_name: string | null;
  account_number: string | null;
  submitted_at: string | null;
};

export type DRSPaymentVerification = {
  reference_number: string | null;
  remarks: string | null;
  verified_at: string | null;
};

export type DRSActiveStageTask = {
  id: string;
  task_id: string;
  name?: string | null;
  kind?: string | null;
  stage_id?: string;
  is_required: boolean;
  allow_remarks?: boolean;
  drs_clearance_id?: string | null;
  status: string;
  remarks?: string | null;
  completed_at?: string | null;
  due_at?: string | null;
  may_complete?: boolean;
  config?: DRSPaymentVerificationTaskConfig | null;
  branch_options?: Array<{
    id: string;
    label: string;
    outcome_key: string;
    is_default: boolean;
    target_stage: DRSApplicationStagePayload | null;
  }>;
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
  disposed_at: string | null;
  disposal_metadata?: Record<string, unknown> | null;
  is_foreigner_student: boolean;
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

export type DRSAssessmentOtherFee = {
  fee_name: string;
  amount: number;
};

export type DRSApplicationDetail = DRSApplicationRow & {
  editable?: boolean;
  may_cancel?: boolean;
  may_cancel_as_staff?: boolean;
  payment_submission?: DRSPaymentSubmission | null;
  payment_verification?: DRSPaymentVerification | null;
  payment_total?: number | null;
  assessment_other_fees?: DRSAssessmentOtherFee[];
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
    remarks?: string | null;
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
