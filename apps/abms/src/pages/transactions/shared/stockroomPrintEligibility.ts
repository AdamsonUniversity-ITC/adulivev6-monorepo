const STOCKROOM_PRINTABLE_STATUSES = new Set([
    'certified',
    'certified rs',
    'served',
    'served rs',
    'served by wico',
]);

function normalizeWorkflowValue(value: string | null | undefined): string {
    return value?.trim().toLowerCase() ?? '';
}

export function canPrintStockroomRequisition(
    rsType: string | null | undefined,
    status: string | null | undefined,
): boolean {
    if (normalizeWorkflowValue(rsType) !== 'stockroom') return true;

    return STOCKROOM_PRINTABLE_STATUSES.has(normalizeWorkflowValue(status));
}

export const STOCKROOM_PRINT_RESTRICTION_MESSAGE =
    'A Stockroom RS can be printed here only when its status is Certified or Served.';
