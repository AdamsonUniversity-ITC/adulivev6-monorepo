import { LucideIcon } from 'lucide-react';
import { Theme } from './tokens';

export type { Theme };

export interface StatusOption {
    label: string;
}

export interface StatusFilterConfig {
    sectionLabel?: string;
    options: StatusOption[];
    /** Status selected when a role view is first opened. Falls back to the first option. */
    defaultLabel?: string;
}

export interface DeptOption {
    id: string;
    name: string;
    kind: 'Department' | 'Section';
}

export interface DeptFilterConfig {
    /** Flat string list is no longer used — kept for backwards compat but ignored when deptOptions is set */
    items?: string[];
    /** Rich dept+section list from loader data */
    deptOptions?: DeptOption[];
    placeholder?: string;
    allLabel?: string;
    sectionLabel?: string;
}

export interface SearchFieldConfig {
    checkboxLabel?: string;
    placeholder?: string;
}

export interface SchoolYearFilterConfig {
    checkboxLabel?: string;
    placeholder?: string;
    /** Unique school years, injected at runtime from the backend (e.g. school-years endpoint) */
    options?: string[];
}

export interface PaymentFormFilterConfig {
    checkboxLabel?: string;
    placeholder?: string;
    options: string[];
}

export interface DateRangeFilterConfig {
    checkboxLabel?: string;
}

export interface ActionButtonConfig {
    label: string;
    icon: LucideIcon;
    variant?: 'secondary' | 'primary';
    onClick?: () => void;
}

export interface FilterPanelConfig {
    status?: StatusFilterConfig;
    department?: DeptFilterConfig;
    searchField?: SearchFieldConfig;
    schoolYear?: SchoolYearFilterConfig;
    paymentForm?: PaymentFormFilterConfig;
    dateRange?: DateRangeFilterConfig;
    sortColumns?: string[];
    actions?: ActionButtonConfig[];
    showControllerReprocessedLegend?: boolean;
}

export interface FilterState {
    activeStatuses: string[];

    selectedDept: string | null;
    selectedDeptId: string | null;
    selectedDeptKind: 'Department' | 'Section' | null;
    allDepts: boolean;
    deptQuery: string;

    searchEnabled: boolean;
    searchValue: string;

    schoolYearEnabled: boolean;
    schoolYear: string | null;

    paymentFormEnabled: boolean;
    paymentForm: string | null;

    dateRangeEnabled: boolean;
    dateFrom: string;
    dateTo: string;

    sortBy: string;
    sortDir: 'asc' | 'desc';
}

export function makeDefaultFilterState(
    config: FilterPanelConfig,
): FilterState {
    const statusOptions = config.status?.options ?? [];
    const allSentinel = statusOptions[0]?.label ?? 'All';
    const configuredDefault = config.status?.defaultLabel;
    const defaultStatus = configuredDefault
        && statusOptions.some(option => option.label === configuredDefault)
        ? configuredDefault
        : allSentinel;

    const firstSortCol =
        config.sortColumns?.[0] ?? '';

    return {
        activeStatuses: [defaultStatus],

        selectedDept: null,
        selectedDeptId: null,
        selectedDeptKind: null,
        allDepts: false,
        deptQuery: '',

        searchEnabled: false,
        searchValue: '',

        schoolYearEnabled: false,
        schoolYear: null,

        paymentFormEnabled: false,
        paymentForm: null,

        dateRangeEnabled: false,
        dateFrom: '',
        dateTo: '',

        sortBy: firstSortCol,
        sortDir: 'desc',
    };
}
