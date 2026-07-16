import type { ReactNode } from 'react';
import type { T } from './theme';

export interface LineItem {
    id: number;
    isNew: boolean;
    description: string;
    unitCost: string;
    quantity: string;
    uom: string;
    totalAmount: string;
}

export interface DeptOption {
    id: string;
    name: string;
    kind: 'Department' | 'Section';
}

export interface MainAccount {
    id: number;
    parent_id: null;
    account_code: string;
    account_name: string;
}

export interface SubAccount {
    id: number;
    parent_id: number;
    account_code: string;
    account_name: string;
}

export type AccountOption = { value: string; label: string };

export type BtnToken = { bg: string; border: string; text: string; hover: string };

export type ThemeTokens = typeof T.dark;

export type ToastType = 'success' | 'info' | 'error';

export interface ToastState {
    visible: boolean;
    message: string;
    type: ToastType;
}

export interface ActionButtonConfig {
    token: BtnToken;
    icon: ReactNode;
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
}
