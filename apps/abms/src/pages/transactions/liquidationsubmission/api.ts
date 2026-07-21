import { financeSvc } from '@repo/axios-config/finance-service';
import type { LiquidationItem, MediaFile } from './types';

export const liquidationItemRequests = new Map<string, Promise<LiquidationItem[]>>();
export const liquidationFileRequests = new Map<string, Promise<MediaFile[]>>();

function isLiquidationItem(value: unknown): value is LiquidationItem {
    if (typeof value !== 'object' || value === null) return false;
    const item = value as Partial<LiquidationItem>;
    return item.id !== undefined && typeof item.description === 'string';
}

export function normalizeLiquidationItems(payload: unknown): LiquidationItem[] {
    if (Array.isArray(payload)) return payload.filter(isLiquidationItem);
    if (typeof payload !== 'object' || payload === null) return [];

    const record = payload as Record<string, unknown>;
    const nested = record.data
        ?? record.budget_requisition_entry_items
        ?? record.buget_requisition_entry_items
        ?? record.items;

    return nested === payload ? [] : normalizeLiquidationItems(nested);
}

export function fetchLiquidationItemsOnce(id: string): Promise<LiquidationItem[]> {
    const existing = liquidationItemRequests.get(id);
    if (existing) return existing;

    const request = financeSvc.get(`abms/liquidation-submission/rs/${id}/items`)
        .then(res => normalizeLiquidationItems(res.data));
    liquidationItemRequests.set(id, request);
    void request.then(
        () => liquidationItemRequests.delete(id),
        () => liquidationItemRequests.delete(id),
    );
    return request;
}

export function fetchLiquidationFilesOnce(id: string): Promise<MediaFile[]> {
    const existing = liquidationFileRequests.get(id);
    if (existing) return existing;

    const request = financeSvc.get(`abms/liquidation-submission/rs/${id}/files`)
        .then(res => res.data?.data ?? []);
    liquidationFileRequests.set(id, request);
    void request.then(
        () => liquidationFileRequests.delete(id),
        () => liquidationFileRequests.delete(id),
    );
    return request;
}

export const fmt = (n: number) =>
    n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function apiErrorMessage(error: unknown, fallback: string): string {
    if (typeof error !== 'object' || error === null || !('response' in error)) return fallback;
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    return typeof response?.data?.message === 'string' ? response.data.message : fallback;
}
