import { DollarSign, ShieldCheck, Truck, Calculator, Package, CreditCard, RefreshCw, Eye } from 'lucide-react';
import { FilterPanelConfig } from './types';

export const ROLES = [
    { key: 'budget-access',     label: 'Budget Office',  icon: DollarSign  },
    { key: 'admin-access',      label: 'Administration', icon: ShieldCheck },
    { key: 'logistics-access',  label: 'Logistics',      icon: Truck       },
    { key: 'accounting-access', label: 'Accounting',     icon: Calculator  },
    { key: 'stockroom-access',  label: 'Stockroom',      icon: Package     },
    { key: 'cashier-access',    label: 'Cashier',        icon: CreditCard  },
] as const;

export type PermissionKey = typeof ROLES[number]['key'];

export const ROLE_COLUMNS: Record<PermissionKey, string[]> = {
    'budget-access':     ['RS No.', 'Payee',        'Department',   'Amount',   'Status', 'Date'],
    'admin-access':      ['RS No.', 'Requested By', 'Department',   'Amount',   'Status', 'Date'],
    'logistics-access':  ['RS No.', 'Description',  'Department',   'Quantity', 'Status', 'Date'],
    'accounting-access': ['RS No.', 'Payee',        'Account',      'Amount',   'Status', 'Date'],
    'stockroom-access':  ['RS No.', 'Item',         'Department',   'Qty',      'Unit',   'Date'],
    'cashier-access':    ['RS No.', 'Payee',        'Payment Form', 'Amount',   'Status', 'Date'],
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

export const ROLE_FILTER_CONFIGS: Partial<Record<PermissionKey, FilterPanelConfig>> = {
    'budget-access': {
        status: {
            options: [
                { label: 'All' },
                { label: 'For Review' },
                { label: 'For Certification' },
                { label: 'Certified RS' },
                { label: 'Unserved RS' },
                { label: 'Served' },
            ],
        },
        department: {
            items: ALL_DEPARTMENTS,
            placeholder: 'Search department…',
            allLabel: 'All Departments',
        },
        searchField: {
            checkboxLabel: 'Search by Requisition No.',
            placeholder: 'e.g. RS-2024-00123',
        },
        sortColumns: ROLE_COLUMNS['budget-access'],
        actions: [
            { label: 'Requery', icon: RefreshCw, variant: 'secondary' },
            { label: 'View RS',  icon: Eye,       variant: 'primary'   },
        ],
    },

    // 'admin-access': {
    //     status: { options: [{ label: 'All' }, { label: 'Pending' }, { label: 'Approved' }] },
    //     department: { items: ALL_DEPARTMENTS },
    //     sortColumns: ROLE_COLUMNS['admin-access'],
    //     actions: [{ label: 'Requery', icon: RefreshCw }],
    // },
    // 'logistics-access': { ... },
    // 'accounting-access': { ... },
    // 'stockroom-access': { ... },
    // 'cashier-access': { ... },
};