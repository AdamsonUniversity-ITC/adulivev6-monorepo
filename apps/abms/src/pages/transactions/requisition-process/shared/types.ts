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
    /** Statuses selected when a role view is first opened. Takes precedence over defaultLabel. */
    defaultLabels?: string[];
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
    defaultSortBy?: string;
    actions?: ActionButtonConfig[];
    showControllerReprocessedLegend?: boolean;
    showControllerPriceReapprovalLegend?: boolean;
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

export function getDefaultStatusSelection(config?: StatusFilterConfig): string[] {
    const options = config?.options.map(option => option.label) ?? [];
    const allSentinel = options[0] ?? 'All';
    const configuredDefaults = config?.defaultLabels?.filter(label => options.includes(label)) ?? [];

    if (configuredDefaults.length > 0) return configuredDefaults;
    if (config?.defaultLabel && options.includes(config.defaultLabel)) return [config.defaultLabel];
    return [allSentinel];
}

export function makeDefaultFilterState(
    config: FilterPanelConfig,
): FilterState {
    const defaultStatuses = getDefaultStatusSelection(config.status);

    const configuredSort = config.defaultSortBy;
    const firstSortCol = configuredSort && config.sortColumns?.includes(configuredSort)
        ? configuredSort
        : config.sortColumns?.[0] ?? '';

    return {
        activeStatuses: defaultStatuses,

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
