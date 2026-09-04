import echo from '../../lib/echo';

export interface RequisitionChatEvent {
    id: number;
    sender_id: string;
    sender_name: string;
    message: string;
    created_at: string;
}

type Listener = (event: RequisitionChatEvent) => void;

interface ManagedSubscription {
    listeners: Set<Listener>;
    dispatch: Listener;
}

const EVENT_NAME = '.RequisitionChatMessageSent';
const subscriptions = new Map<number, ManagedSubscription>();

/**
 * Shares one Echo listener per requisition across worklists and modals. Echo's
 * channel instance is global, so leaving it from one component must not remove
 * another component's active listener.
 */
export function subscribeToRequisitionChat(entryId: number, listener: Listener): () => void {
    let managed = subscriptions.get(entryId);

    if (!managed) {
        const listeners = new Set<Listener>();
        const dispatch: Listener = event => {
            listeners.forEach(activeListener => activeListener(event));
        };

        echo.private(`requisition-chat.${entryId}`).listen(EVENT_NAME, dispatch);
        managed = { listeners, dispatch };
        subscriptions.set(entryId, managed);
    }

    managed.listeners.add(listener);

    return () => {
        const active = subscriptions.get(entryId);
        if (!active) return;

        active.listeners.delete(listener);
        if (active.listeners.size > 0) return;

        try {
            echo.private(`requisition-chat.${entryId}`).stopListening(EVENT_NAME, active.dispatch);
            echo.leave(`requisition-chat.${entryId}`);
        } catch {
            // The socket may already be disconnected; local bookkeeping still
            // needs to be cleared so a later subscriber can reconnect.
        }
        subscriptions.delete(entryId);
    };
}
