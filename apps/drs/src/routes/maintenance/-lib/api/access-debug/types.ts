export type AccessDebugCheck = {
  code: string;
  passed: boolean;
  severity: 'info' | 'warning' | 'error';
  message: string;
  details: Record<string, unknown>;
};

export type AccessDebugSubjectUser = {
  user_id: number | null;
  emp_no: string;
  name: string;
};

export type AccessDebugApplication = {
  id: string;
  drs_no: string | null;
  status: string;
  course_id: string;
  is_foreigner_student: boolean;
  is_cancelled: boolean;
};

export type AccessDebugExplainResponse = {
  data: {
    subject_user: AccessDebugSubjectUser | null;
    application: AccessDebugApplication | null;
    summary: string;
    can_view_application: boolean | null;
    can_see_in_queue: boolean | null;
    checks: AccessDebugCheck[];
  };
};
