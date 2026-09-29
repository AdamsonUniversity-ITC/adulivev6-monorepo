export const REQUISITION_TEXT_LIMIT = 255;
export const MONEY_MAX = 9999999999999.99;
export const ITEM_QUANTITY_MAX = 2147483647;
export const UNSIGNED_BIGINT_MAX = '18446744073709551615';

export function normalizeItemDescription(value: string): string {
    return value.replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/[\s\u00A0]+/gu, ' ')
        .trim();
}

export function characterCount(value: string): number {
    return Array.from(value).length;
}

export function validUnsignedBigint(value: string): boolean {
    if (!/^\d{1,20}$/.test(value)) return false;
    const normalized = value.replace(/^0+/, '') || '0';
    return normalized.length < UNSIGNED_BIGINT_MAX.length
        || (normalized.length === UNSIGNED_BIGINT_MAX.length && normalized <= UNSIGNED_BIGINT_MAX);
}

export function validMoney(value: string): boolean {
    return /^(?:0|[1-9]\d{0,12})(?:\.\d{1,2})?$/.test(value)
        && Number(value) >= 0.01
        && Number(value) <= MONEY_MAX;
}
