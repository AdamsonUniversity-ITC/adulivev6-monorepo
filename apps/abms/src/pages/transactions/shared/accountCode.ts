export function formatAccountCode(
    parentCode: string | number | null | undefined,
    subAccountCode: string | number | null | undefined,
): string {
    const parent = String(parentCode ?? '').trim();
    const child = String(subAccountCode ?? '').trim();

    if (parent && child) return `${parent} - ${child}`;

    return child || parent || '—';
}
