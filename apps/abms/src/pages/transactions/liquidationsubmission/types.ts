export type ToastKind = 'success' | 'error' | 'info' | 'warning';
export interface ToastItem { id: number; kind: ToastKind; title: string; description?: string }
export interface DeptOption { id: string; name: string; kind: 'Department' | 'Section' }
export interface LiquidationRecord { id: string; date: string; requisition_no: string; department_section: string; requested_by: string; requested_by_empno: string; total_amount: number; status: string; location: string; from: string; is_approve: number | string | boolean; for_liquidation: boolean; remarks: string | null; items?: LiquidationItem[] }
export interface LiquidationItem { id: number; account_id: number | null; account_code: string; description: string; quantity: number; unit_of_measurement: string; unit_cost: number; total_cost: number; unused_amount: number }
export interface MediaFile { id: number; name: string; file_name: string; mime_type: string; size: number; url: string; expires_at: string; created_at: string }
export interface PendingFile { id: string; file: File }
