import { useCallback, useEffect, useMemo, useState } from 'react';
import { financeSvc } from '@repo/axios-config/finance-service';
import { subscribeToRequisitionChat } from './realtime';

type UnreadCounts = Record<number, number>;

const REQUEST_BATCH_SIZE = 100;
const RECONCILE_INTERVAL_MS = 60_000;

function chunks<T>(values: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let index = 0; index < values.length; index += size) {
        result.push(values.slice(index, index + size));
    }
    return result;
}

export function useRequisitionUnreadCounts(entryIds: number[], currentUserId: string) {
    const signature = [...new Set(entryIds.filter(id => Number.isInteger(id) && id > 0))]
        .sort((left, right) => left - right)
        .join(',');
    const ids = useMemo(
        () => signature ? signature.split(',').map(Number) : [],
        [signature],
    );
    const [counts, setCounts] = useState<UnreadCounts>({});

    const refresh = useCallback(async (requestedIds: number[]) => {
        const targets = [...new Set(requestedIds.filter(id => id > 0))];
        if (!currentUserId || targets.length === 0) return;

        try {
            const responses = await Promise.all(
                chunks(targets, REQUEST_BATCH_SIZE).map(batch => financeSvc.get(
                    '/abms/budget-request-entry/chats/unread-counts',
                    { params: { ids: batch } },
                )),
            );

            const next: UnreadCounts = {};
            responses.forEach(response => {
                Object.entries(response.data ?? {}).forEach(([id, count]) => {
                    next[Number(id)] = Number(count) || 0;
                });
            });
            setCounts(previous => ({ ...previous, ...next }));
        } catch {
            // Worklists remain usable and retain their last known counts. The
            // next focus, interval, pagination, or modal close retries.
        }
    }, [currentUserId]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => void refresh(ids), 0);
        return () => window.clearTimeout(timeoutId);
    }, [ids, refresh]);

    useEffect(() => {
        if (!currentUserId || ids.length === 0) return;

        const unsubscribe = ids.flatMap(entryId => {
            try {
                return [subscribeToRequisitionChat(entryId, event => {
                    if (event.sender_id === currentUserId) return;
                    setCounts(previous => ({
                        ...previous,
                        [entryId]: (previous[entryId] ?? 0) + 1,
                    }));
                })];
            } catch {
                // The periodic and focus reconciliation remain available when
                // the realtime client cannot subscribe.
                return [];
            }
        });

        return () => unsubscribe.forEach(stop => stop());
    }, [currentUserId, ids]);

    useEffect(() => {
        if (!currentUserId || ids.length === 0) return;

        const intervalId = window.setInterval(() => void refresh(ids), RECONCILE_INTERVAL_MS);
        const handleFocus = () => void refresh(ids);
        window.addEventListener('focus', handleFocus);

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener('focus', handleFocus);
        };
    }, [currentUserId, ids, refresh]);

    const clearUnread = useCallback((entryId: number) => {
        setCounts(previous => ({ ...previous, [entryId]: 0 }));
    }, []);

    const refreshOne = useCallback((entryId: number) => refresh([entryId]), [refresh]);

    return { counts, clearUnread, refreshOne };
}
