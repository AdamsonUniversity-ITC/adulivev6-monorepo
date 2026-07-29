import { DollarSign, ShieldCheck, Truck, Calculator, Package, CreditCard, RefreshCw, Eye, BadgeCheck } from 'lucide-react';
import { FilterPanelConfig } from './types';

export const ROLES = [
    { key: 'budget-access', label: 'Budget Office', icon: DollarSign },
    { key: 'admin-access', label: 'Administration', icon: ShieldCheck },
    { key: 'controller-access', label: 'Controller', icon: BadgeCheck },
    { key: 'logistics-access', label: 'Purchasing', icon: Truck },
    { key: 'accounting-access', label: 'Accounting', icon: Calculator },
    { key: 'stockroom-access', label: 'Stockroom', icon: Package },
    { key: 'cashier-access', label: 'Cashier', icon: CreditCard },
] as const;

export type PermissionKey = typeof ROLES[number]['key'];

export const ROLE_COLUMNS: Record<PermissionKey, string[]> = {
    'budget-access': ['Date', 'Requisition No.', 'Department/Section', 'Requested By', 'Total Amount', 'Status', 'Location', 'From'],
    'admin-access': ['Date', 'Requisition No.', 'Department/Section', 'Requested By', 'Total Amount', 'Status', 'Controller Approval', 'Location', 'From'],
    'controller-access': ['Date', 'Requisition No.', 'Department/Section', 'Requested By', 'Total Amount', 'Status', 'Controller Approval', 'Location', 'From'],
    'logistics-access': ['Date', 'Requisition No.', 'Department/Section', 'Requested By', 'Total Amount', 'Status', 'Location', 'From'],
    'accounting-access': ['Date', 'Requisition No.', 'Department/Section', 'Requested By', 'Total Amount', 'Status', 'Location', 'From'],
    'stockroom-access': ['Date', 'Requisition No.', 'Department/Section', 'Requested By', 'Total Amount', 'Status', 'Location', 'From'],
    'cashier-access': ['Date', 'Requisition No.', 'Department/Section', 'Requested By', 'Total Amount', 'Status', 'Location', 'From'],
};

export const ALL_DEPARTMENTS = [
    'Accountancy', 'Architecture', 'Biology', 'Chemical Engineering',
    'Chemistry', 'Civil Engineering', 'Computer Science', 'Criminology',
    'Economics', 'Education', 'Electronics Engineering', 'English',
    'Environmental Science', 'Fine Arts', 'History', 'Hotel & Restaurant Mgmt',
    'Industrial Engineering', 'Information Technology', 'Law', 'Liberal Arts',
    'Management', 'Marketing', 'Mathematics', 'Mechanical Engineering',
    'Medical Technology', 'Nursing', 'Nutrition & Dietetics', 'Pharmacy',
    'Philosophy', 'Physical Education', 'Physics', 'Political Science',
    'Psychology', 'Social Work', 'Sociology', 'Tourism',
];

// Budget Office status filters
const BUDGET_STATUS_OPTIONS = [
    { label: 'All' },
    { label: 'For Review' },
    { label: 'Reprocess' },
    { label: 'For Certification' },
    { label: 'Certified RS' },
    { label: 'On Process' },
    { label: 'Unserved RS' },
    { label: 'Served RS' },
];

// Administration uses the workflow's actual stage name in the UI.
const ADMIN_STATUS_OPTIONS = BUDGET_STATUS_OPTIONS.map(option =>
    option.label === 'For Certification'
        ? { label: 'For Budget Director' }
        : option
).concat({ label: 'For Approval' });

// Logistics / Purchasing-specific status filters
const LOGISTICS_STATUS_OPTIONS = [
    { label: 'All' },
    { label: 'For Purchase' },
    { label: 'For Pricing' },
    { label: 'For Approval' },
    { label: 'PO On Process' },
    { label: 'Served' },
];

// Controller-specific status filters
const CONTROLLER_STATUS_OPTIONS = [
    { label: 'All' },
    { label: 'For Controller' },
    { label: 'On Process' },
    { label: 'Certified' },
    { label: 'Served' },
];

// Stockroom-specific status filters
const STOCKROOM_STATUS_OPTIONS = [
    { label: 'All' },
    { label: 'To Process RS' },
    { label: 'Processed RS' },
    { label: 'Served' },
];

// Shared department filter config (deptOptions injected at runtime from loader data)
const COMMON_DEPT_CONFIG = {
    placeholder: 'Select department / section…',
    allLabel: 'All Departments',
};

// Shared search field config
const COMMON_SEARCH_CONFIG = {
    checkboxLabel: 'Search by Requisition No.',
    placeholder: 'e.g. 2026100000',
};

// Shared school year filter config (options injected at runtime from backend)
const COMMON_SCHOOL_YEAR_CONFIG = {
    checkboxLabel: 'Filter by School Year',
    placeholder: 'Select school year…',
};

// Shared date range filter config
const COMMON_DATE_RANGE_CONFIG = {
    checkboxLabel: 'Filter by Date Range',
};

// Shared sort columns
const COMMON_SORT_COLUMNS = ['Date', 'Requisition No.', 'Department/Section', 'Requested By', 'Total Amount', 'Status'];

// Shared action buttons (onClick wired at runtime in each view)
const COMMON_ACTIONS = [
    { label: 'Requery', icon: RefreshCw, variant: 'secondary' as const },
    { label: 'View RS', icon: Eye, variant: 'primary' as const },
];

const PAYMENT_FORM_OPTIONS = [
    'All Except PNB Credit Card Payment',
    'Payment for Supplier/Water',
    'Reimbursement/Replenishment',
    'Payment for Honorarium',
    'Payment for Employee Benefits(Maternal Leave, Magna Carta, etc.)',
    'Request for Cash Advance',
    'PNB Credit Card Payment',
];

const COMMON_PAYMENT_FORM_CONFIG = {
    checkboxLabel: 'Filter by Payment Form',
    placeholder: 'Select payment form…',
    options: PAYMENT_FORM_OPTIONS,
};

export const ROLE_FILTER_CONFIGS: Record<PermissionKey, FilterPanelConfig> = {
    'budget-access': {
        status: { options: BUDGET_STATUS_OPTIONS, defaultLabel: 'For Review' },
        department: COMMON_DEPT_CONFIG,
        searchField: COMMON_SEARCH_CONFIG,
        schoolYear: COMMON_SCHOOL_YEAR_CONFIG,
        dateRange: COMMON_DATE_RANGE_CONFIG,
        paymentForm: COMMON_PAYMENT_FORM_CONFIG,
        sortColumns: COMMON_SORT_COLUMNS,
        actions: COMMON_ACTIONS,
    },
    'admin-access': {
        status: { options: ADMIN_STATUS_OPTIONS, defaultLabel: 'For Budget Director' },
        department: COMMON_DEPT_CONFIG,
        searchField: COMMON_SEARCH_CONFIG,
        schoolYear: COMMON_SCHOOL_YEAR_CONFIG,
        paymentForm: COMMON_PAYMENT_FORM_CONFIG,
        dateRange: COMMON_DATE_RANGE_CONFIG,
        sortColumns: COMMON_SORT_COLUMNS,
        actions: COMMON_ACTIONS,
    },
    'controller-access': {
        status: { options: CONTROLLER_STATUS_OPTIONS, defaultLabel: 'For Controller' },
        department: COMMON_DEPT_CONFIG,
        searchField: COMMON_SEARCH_CONFIG,
        schoolYear: COMMON_SCHOOL_YEAR_CONFIG,
        dateRange: COMMON_DATE_RANGE_CONFIG,
        paymentForm: COMMON_PAYMENT_FORM_CONFIG,
        sortColumns: COMMON_SORT_COLUMNS,
        actions: COMMON_ACTIONS,
    },
    'logistics-access': {
        status: { options: LOGISTICS_STATUS_OPTIONS, defaultLabel: 'For Pricing' },
        department: COMMON_DEPT_CONFIG,
        searchField: COMMON_SEARCH_CONFIG,
        schoolYear: COMMON_SCHOOL_YEAR_CONFIG,
        dateRange: COMMON_DATE_RANGE_CONFIG,
        sortColumns: COMMON_SORT_COLUMNS,
        actions: COMMON_ACTIONS,
    },
    'accounting-access': {
        status: { options: BUDGET_STATUS_OPTIONS },
        department: COMMON_DEPT_CONFIG,
        searchField: COMMON_SEARCH_CONFIG,
        schoolYear: COMMON_SCHOOL_YEAR_CONFIG,
        dateRange: COMMON_DATE_RANGE_CONFIG,
        sortColumns: COMMON_SORT_COLUMNS,
        actions: COMMON_ACTIONS,
    },
    'stockroom-access': {
        status: { options: STOCKROOM_STATUS_OPTIONS, defaultLabel: 'To Process RS' },
        department: COMMON_DEPT_CONFIG,
        searchField: COMMON_SEARCH_CONFIG,
        schoolYear: COMMON_SCHOOL_YEAR_CONFIG,
        dateRange: COMMON_DATE_RANGE_CONFIG,
        sortColumns: COMMON_SORT_COLUMNS,
        actions: COMMON_ACTIONS,
    },
    'cashier-access': {
        status: { options: BUDGET_STATUS_OPTIONS },
        department: COMMON_DEPT_CONFIG,
        searchField: COMMON_SEARCH_CONFIG,
        schoolYear: COMMON_SCHOOL_YEAR_CONFIG,
        dateRange: COMMON_DATE_RANGE_CONFIG,
        sortColumns: COMMON_SORT_COLUMNS,
        actions: COMMON_ACTIONS,
    },
};
