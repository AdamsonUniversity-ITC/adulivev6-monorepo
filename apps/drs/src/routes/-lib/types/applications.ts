export type DRSApplicationClearedRef = {
  type: string;
  id: string;
} | null;

export type DRSApplicationLineRow = {
  id: string;
  request_type: 'document' | 'package' | null;
  request_name: string;
  quantity: number;
};

export type DRSApplicationClearanceRow = {
  id: string;
  drs_clearance_id: string;
  clearance_name: string;
  status: 'pending' | 'cleared' | string;
  cleared_at: string | null;
};

export type DRSApplicationRow = {
  id: string;
  student_no: string;
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
  created_at: string | null;
  updated_at: string | null;
};
