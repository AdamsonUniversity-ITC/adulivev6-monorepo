import type { DeptOption, LineItem } from './types';
import { organizationalUnitKey } from '../../../lib/organizationalUnit';

interface BudgetProposalApiItem {
    id?: number;
    description?: string | null;
    unit_cost?: number | string | null;
    quantity?: number | string | null;
    unit_measurement?: string | null;
    total_cost?: number | string | null;
}

export const fmtDate = (dt: string) =>
    dt
        ? new Date(dt).toLocaleString('en-PH', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        })
        : '—';

export const isEntryPeriodOpen = (entryFrom: string, entryTo: string) => {
    if (!entryFrom || !entryTo) return false;

    const now = new Date();
    return now >= new Date(entryFrom) && now <= new Date(entryTo);
};

export const mapApiItemToLineItem = (item: BudgetProposalApiItem): LineItem => ({
    id: item.id ?? Date.now() + Math.random(),
    isNew: false,
    description: item.description ?? '',
    unitCost: String(item.unit_cost ?? ''),
    quantity: String(item.quantity ?? ''),
    uom: item.unit_measurement ?? '',
    totalAmount: String(item.total_cost ?? ''),
});

export const mapApiItemToCopiedLineItem = (item: BudgetProposalApiItem): LineItem => ({
    id: Date.now() + Math.random(),
    isNew: true,
    description: item.description ?? '',
    unitCost: String(item.unit_cost ?? ''),
    quantity: String(item.quantity ?? ''),
    uom: item.unit_measurement ?? '',
    totalAmount: String(item.total_cost ?? ''),
});

export const getDeptName = (
    departments: DeptOption[],
    sections: DeptOption[],
    selectedDept: string,
    selectedDeptKind: 'Department' | 'Section',
) => {
    const selectedValue = organizationalUnitKey(selectedDeptKind, selectedDept);
    return [...departments, ...sections]
        .find(option => organizationalUnitKey(option.kind, option.id) === selectedValue)
        ?.name ?? '';
};
