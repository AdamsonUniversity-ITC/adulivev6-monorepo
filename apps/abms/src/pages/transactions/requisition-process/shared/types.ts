import { LucideIcon } from 'lucide-react';
import { Theme } from './tokens';

export type { Theme };

export interface StatusOption {
    label: string;
}

export interface StatusFilterConfig {
    sectionLabel?: string;
    options: StatusOption[];
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
    sortColumns?: string[];
    actions?: ActionButtonConfig[];
}

export interface FilterState {
    activeStatuses: string[];
    /** The dept/section name string — used as display label and for plain-string consumers */
    selectedDept: string | null;
    /** The dept/section id — used when the dropdown is in DeptOption mode */
    selectedDeptId: string | null;
    /** 'Department' | 'Section' | null — set alongside selectedDeptId */
    selectedDeptKind: 'Department' | 'Section' | null;
    allDepts: boolean;
    deptQuery: string;
    searchEnabled: boolean;
    searchValue: string;
    sortBy: string;
    sortDir: 'asc' | 'desc';
}

export function makeDefaultFilterState(
    config: FilterPanelConfig,
): FilterState {
    const allSentinel = config.status?.options?.[0]?.label ?? 'All';
    const firstSortCol = config.sortColumns?.[0] ?? '';
    return {
        activeStatuses: [allSentinel],
        selectedDept: null,
        selectedDeptId: null,
        selectedDeptKind: null,
        allDepts: false,
        deptQuery: '',
        searchEnabled: false,
        searchValue: '',
        sortBy: firstSortCol,
        sortDir: 'asc',
    };
}