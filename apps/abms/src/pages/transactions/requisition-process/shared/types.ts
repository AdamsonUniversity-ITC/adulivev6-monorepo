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

export interface DeptFilterConfig {
    items: string[];
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