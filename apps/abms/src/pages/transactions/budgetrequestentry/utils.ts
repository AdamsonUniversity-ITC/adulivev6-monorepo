import type { Status } from './types';

export const LIQUIDATION_COLOR = '#eab308';

/** Row tint for entries tagged for_liquidation — distinct from status colors,
 *  since the tag is independent of the row's status. */
export function liquidationRowBg(isDark: boolean): string {
    return isDark ? 'rgba(234,179,8,0.10)' : 'rgba(234,179,8,0.08)';
}
export function liquidationRowHoverBg(isDark: boolean): string {
    return isDark ? 'rgba(234,179,8,0.16)' : 'rgba(234,179,8,0.13)';
}

export const fmt = (n: number) =>
    n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function getCurrentSchoolYear(): string {
    const now = new Date();
    const month = now.getMonth(); // 0-indexed; June = 5
    const year = now.getFullYear();
    // School year starts in June
    const syStart = month >= 5 ? year : year - 1;
    return `${syStart}–${syStart + 1}`;
}

export function formatCurrentDate(): string {
    return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

export const fmtCurrency = (n: number) =>
    n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Normalises raw DB strings → Status union (lowercased, trimmed)
export function normalizeStatus(raw: string | null | undefined): Status {
    if (!raw) return 'for review';
    const s = raw.toLowerCase().trim() as Status;
    const valid: Status[] = [
        'unsaved', 'for review', 'for certification', 'certified', 'for pricing',
        'disapproved', 'cancelled', 'served by wico',
        'for budget staff', 'for budget director', 'for purchase', 'po on process', 'on process', 'for approval',
    ];
    return valid.includes(s) ? s : 'for review';
}

export function isZeroRequisitionNumber(value: string | number | null | undefined): boolean {
    if (value === null || value === undefined) return false;
    const normalized = String(value).trim();
    return normalized === '0' || normalized === '';
}

export function formatRequisitionNumber(value: string | number | null | undefined): string {
    return isZeroRequisitionNumber(value) ? 'unsaved' : String(value ?? '—');
}

export function normalizeEntryStatus(
    raw: string | null | undefined,
    requisitionNumber?: string | number | null,
): Status {
    if (isZeroRequisitionNumber(requisitionNumber)) return 'unsaved';
    return normalizeStatus(raw);
}
