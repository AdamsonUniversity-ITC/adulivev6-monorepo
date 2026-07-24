import type { T } from './theme';

export type ThemeTokens = typeof T.dark;

export type Status =
    | 'unsaved'
    | 'reprocess'
    | 'for review'
    | 'for certification'
    | 'certified'
    | 'for pricing'
    | 'disapproved'
    | 'cancelled'
    | 'served by wico'
    | 'for budget staff'
    | 'for budget director'
    | 'for purchase'
    | 'po on process'
    | 'on process'
    | 'for approval';

export interface DeptOption { id: string; name: string; kind: 'Department' | 'Section' }

export interface RSRecord {
    id: number; date: string; requisitionNo: string;
    payee: string;
    requestedBy: string;
    requestedByName: string;
    totalAmount: number; status: Status;
    forLiquidation?: boolean;
}

export interface ChatMessage {
    id: number;
    sender_id: string;
    sender_name: string;
    message: string;
    created_at: string;
}



export type ToastKind = 'success' | 'error' | 'info';
export interface ToastItem { id: number; kind: ToastKind; message: string }

export type BtnToken = { bg: string; border: string; text: string; hover: string };

export interface SupplyItem {
    id: number; item_code: string; item_name: string;
    unit_measurement: string; unit_cost: string;
}

export interface SupplyPage {
    data: SupplyItem[];
    next_cursor: string | null;
    prev_cursor: string | null;
    per_page: number;
}

export interface PayeeDetails {
    payee: string;
    tinNo: string;
    aduEmployee: boolean;
    nonVatRegistered: boolean;
    vatRegistered: boolean;
    mopCheque: boolean;
    mopBankTransfer: boolean;
    bankName: string;
    accountName: string;
    accountNumber: string;
    bankAddress: string;
}

export type RSType = 'stockroom' | 'logistics' | 'cashier' | null;

export const PAYMENT_FORMS = [
    'Payment for Supplier/Water',
    'Reimbursement/Replenishment',
    'Payment for Honorarium',
    'Payment for Employee Benefits(Maternal Leave, Magna Carta, etc.)',
    'Request for Cash Advance',
    'PNB Credit Card Payment',

];

export interface RSTypeOption {
    id: RSType;
    label: string;
    note: string;
}

export interface AccountOption {
    account_id: number;
    account_code: string;
    account_name: string;
    main_account_code?: string | null;
    main_account_name?: string | null;
    balance: number;
    account_parent_id: number;
}

export interface AddItemFormState {
    accountId: number | null;
    accountNo: string;
    accountName: string;
    accountParentId: string;
    balance: string;
    itemDescription: string;
    unitCost: string;
    quantity: string;
    unitOfMeasurement: string;
    officeSupplyId: number | null;
}

export type AddItemSchemaErrors = Partial<Record<keyof AddItemFormState | 'balance_cap', string>>;

export interface RSFormItem {
    id: number;
    account_id?: number | null;
    accountNo: string;
    itemDescription: string;
    unitCost: string;
    quantity: string;
    unitOfMeasurement: string;
    totalCost: number;
}

export type QuotationStatus = 'none' | 'pending' | 'accepted';

export interface QuotedPricePreviewItem {
    id: number;
    sub_account_id: number | null;
    account_id: number | null;
    account_code: string;
    description: string;
    quantity: number;
    unit_of_measurement: string;
    unit_cost: number;
    quoted_price: number | null;
    current_total: number;
    quoted_total: number;
    delta: number;
    account_balance: number | null;
    balance_after: number | null;
    sufficient: boolean | null;
}

export interface QuotedPricePreviewAccount {
    sub_account_id: number;
    account_id: number;
    account_code: string;
    current_balance: number;
    net_delta: number;
    balance_after: number;
    sufficient: boolean;
}

export interface QuotedPricePreview {
    has_quoted_prices: boolean;
    quotation_status: QuotationStatus;
    current_total: number;
    quoted_total: number;
    total_delta: number;
    all_sufficient: boolean;
    items: QuotedPricePreviewItem[];
    accounts: QuotedPricePreviewAccount[];
}

export interface PayeeDetailRecord {
    tin: string | null;
    is_adu_employee: boolean;
    is_vat_registered: boolean;
    is_cheque: boolean;
    is_bank: boolean;
    bank_name: string | null;
    account_name: string | null;
    account_number: string | null;
    bank_address: string | null;
}

export interface RSViewHeader {
    id: number;
    requisition_number: string;
    rstype: string;
    payee: string;
    payment_form: string | null;
    requested_by: string;
    requested_by_name: string;
    department: string;
    department_id: string | null;
    section_id: string | null;
    school_year: string;
    status: string;
    total_amount: number;
    created_at: string;
    note: string | null;
    location: string | null;
}
