import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, RefreshCw, Send, X } from 'lucide-react';
import { financeSvc } from '@repo/axios-config/finance-service';
import echo from '../../../../lib/echo';
import type { ChatMessage, ThemeTokens } from '../types';

export function ChatModal({
    open,
    onClose,
    entryId,
    currentUser,
    t,
    isDark,
    incomingMessage,
}: {
    open: boolean;
    onClose: () => void;
    entryId: number;
    currentUser: { id: string; name: string };
    t: ThemeTokens;
    isDark: boolean;
    incomingMessage?: ChatMessage | null;
}) {
    if (!open) return null;

    const portal = createPortal(
        <>
            <style>{`@keyframes modal-overlay-in { from { opacity: 0; } to { opacity: 1; } } @keyframes modal-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
            {/* Overlay */}
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.55)',
                    zIndex: 999998,
                    animation: 'modal-overlay-in .20s ease',
                    backdropFilter: 'blur(2px)',
                }}
                onClick={onClose}
            />
            {/* Modal card */}
            <div
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 999999,
                    background: t.cardBg,
                    border: `1px solid ${t.cardBorder}`,
                    borderRadius: 14,
                    boxShadow: t.cardShadow,
                    width: '90%',
                    maxWidth: 600,
                    height: 'min(85dvh, 700px)',
                    maxHeight: 'calc(100dvh - 24px)',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'modal-in .22s cubic-bezier(.22,1,.36,1)',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 22px',
                        background: t.cardHeaderBg,
                        borderBottom: `1px solid ${t.cardHeaderBorder}`,
                        borderRadius: '14px 14px 0 0',
                        flexShrink: 0,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MessageSquare
                            style={{
                                width: 16,
                                height: 16,
                                color: isDark ? '#60a5fa' : '#3b82f6',
                            }}
                        />
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: t.titleColor,
                                letterSpacing: '-.01em',
                            }}
                        >
                            Discussion
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            border: 'none',
                            background: 'transparent',
                            color: t.cellMuted,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all .12s ease',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = isDark
                                ? 'rgba(248,113,113,0.18)'
                                : 'rgba(254,242,242,0.80)';
                            (e.currentTarget as HTMLElement).style.color = isDark ? '#f87171' : '#dc2626';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                            (e.currentTarget as HTMLElement).style.color = t.cellMuted;
                        }}
                    >
                        <X style={{ width: 16, height: 16 }} />
                    </button>
                </div>

                {/* Chat panel content */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <RSChatPanel
                        entryId={entryId}
                        currentUser={currentUser}
                        t={t}
                        isDark={isDark}
                        incomingMessage={incomingMessage}
                    />
                </div>
            </div>
        </>,
        document.body,
    );

    return <>{portal}</>;
}

export function RSChatPanel({
    entryId,
    currentUser,
    t,
    isDark,
    onNewMessage,
    incomingMessage,
}: {
    entryId: number;
    currentUser: { id: string; name: string };
    t: ThemeTokens;
    isDark: boolean;
    onNewMessage?: () => void;
    incomingMessage?: ChatMessage | null;
}) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [broadcastError, setBroadcastError] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    // Shared cursor: tracks the highest message id seen across the initial
    // load, WebSocket deliveries, and poll results. Using a ref so the
    // interval callback always reads the latest value without re-subscribing.
    const lastMessageIdRef = useRef<number>(0);

    // ── Consume messages pushed from the parent's WebSocket listener ─────────
    useEffect(() => {
        if (!incomingMessage) return;
        setMessages(prev => {
            if (prev.some(m => m.id === incomingMessage.id)) return prev;
            return [...prev, incomingMessage];
        });
        // Advance the polling cursor so the next poll skips this message
        // and doesn't trigger a second badge increment via onNewMessage.
        if (incomingMessage.id > lastMessageIdRef.current) {
            lastMessageIdRef.current = incomingMessage.id;
        }
        // Mark as read since the panel is open
        financeSvc
            .post(`/abms/budget-request-entry/${entryId}/chats/mark-read`, {
                userId: currentUser.id,
                lastChatId: incomingMessage.id,
            })
            .catch(() => { });
        onNewMessage?.();
    }, [incomingMessage]);

    // ── Load existing messages on mount ──────────────────────────────────────
    useEffect(() => {
        setIsLoading(true);
        financeSvc
            .get(`/abms/budget-request-entry/${entryId}/chats`, {
                params: { userId: currentUser.id },
            })
            .then(res => {
                const loaded: ChatMessage[] = res.data.chats ?? [];
                setMessages(loaded);
                // Seed the cursor so the poller starts after what was already
                // loaded, preventing re-delivery and a second badge increment.
                if (loaded.length > 0) {
                    lastMessageIdRef.current = Math.max(...loaded.map(m => m.id));
                }
            })
            .catch(() => { })
            .finally(() => setIsLoading(false));
    }, [entryId, currentUser.id]);

    // ── Scroll to bottom whenever messages change ─────────────────────────────
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Subscribe to Reverb private channel or fallback to polling ──────────
    useEffect(() => {
        if (!entryId || !currentUser.id) return;

        let isSubscribed = true;

        // Function to poll for new messages
        const pollMessages = async () => {
            try {
                const res = await financeSvc.get(`/abms/budget-request-entry/${entryId}/chats`, {
                    // Use the shared ref — always in sync with the initial load
                    // and any WebSocket messages, so the poll never re-fetches
                    // an already-seen message and double-fires the badge.
                    params: { userId: currentUser.id, lastId: lastMessageIdRef.current },
                });
                if (isSubscribed) {
                    const newMessages = res.data.chats ?? [];
                    if (newMessages.length > 0) {
                        setMessages(prev => {
                            const merged = [...prev];
                            for (const newMsg of newMessages) {
                                if (!merged.some(m => m.id === newMsg.id)) {
                                    merged.push(newMsg);
                                }
                            }
                            return merged.sort((a, b) => a.id - b.id);
                        });
                        const newMsgIds = newMessages.map((m: ChatMessage) => m.id);
                        lastMessageIdRef.current = Math.max(...newMsgIds);
                    }
                }
            } catch (err) {
                console.error('Error polling messages:', err);
            }
        };

        // RSChatPanel no longer owns the WebSocket — RSViewModal holds the
        // persistent echo subscription to avoid double-firing. We poll here
        // as the only mechanism so messages still appear when WebSocket is down.
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = setInterval(pollMessages, 3000);

        return () => {
            isSubscribed = false;
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, [entryId, currentUser.id]);

    // ── Send ─────────────────────────────────────────────────────────────────
    async function handleSend() {
        const text = inputValue.trim();
        if (!text || isSending) return;
        setIsSending(true);
        setInputValue('');

        // Optimistic local push
        const optimistic: ChatMessage = {
            id: Date.now(), // temp id
            sender_id: currentUser.id,
            sender_name: currentUser.name,
            message: text,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimistic]);

        try {
            const res = await financeSvc.post(`/abms/budget-request-entry/${entryId}/chats`, {
                sender_id: currentUser.id,
                sender_name: currentUser.name,
                message: text,
            });
            // Replace optimistic with server-confirmed message
            const confirmed: ChatMessage = res.data.chat;
            setMessages(prev =>
                prev.map(m => (m.id === optimistic.id ? confirmed : m))
            );
        } catch {
            // Remove optimistic on failure
            setMessages(prev => prev.filter(m => m.id !== optimistic.id));
            setInputValue(text); // restore input
        } finally {
            setIsSending(false);
            inputRef.current?.focus();
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    function formatTime(iso: string) {
        return new Date(iso).toLocaleTimeString('en-PH', {
            hour: '2-digit', minute: '2-digit', hour12: true,
        });
    }
    function formatDate(iso: string) {
        return new Date(iso).toLocaleDateString('en-PH', {
            month: 'short', day: 'numeric', year: 'numeric',
        });
    }

    // Group messages by calendar date for date separators
    const grouped: { date: string; msgs: ChatMessage[] }[] = [];
    for (const msg of messages) {
        const date = formatDate(msg.created_at);
        const last = grouped[grouped.length - 1];
        if (last && last.date === date) {
            last.msgs.push(msg);
        } else {
            grouped.push({ date, msgs: [msg] });
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: 360,
                borderTop: `1px solid ${t.cardHeaderBorder}`,
                background: isDark ? 'rgba(7,14,32,0.95)' : 'rgba(245,249,255,0.98)',
            }}
        >
            {/* Panel header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    background: t.cardHeaderBg,
                    borderBottom: `1px solid ${t.cardHeaderBorder}`,
                    flexShrink: 0,
                }}
            >
                <MessageSquare style={{ width: 13, height: 13, color: isDark ? '#60a5fa' : '#3b82f6' }} />
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: t.titleColor,
                        letterSpacing: '-.01em',
                    }}
                >
                    Discussion
                </span>
                <span
                    style={{
                        marginLeft: 'auto',
                        fontSize: 9,
                        fontWeight: 600,
                        color: t.cellMuted,
                    }}
                >
                    {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                </span>
            </div>

            {/* Warning banner if using polling fallback */}
            {broadcastError && (
                <div
                    style={{
                        padding: '8px 14px',
                        background: isDark ? 'rgba(251,146,60,0.18)' : 'rgba(254,215,170,0.50)',
                        borderBottom: `1px solid ${isDark ? 'rgba(251,146,60,0.35)' : 'rgba(194,65,12,0.30)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 9,
                        fontWeight: 600,
                        color: isDark ? '#fb923c' : '#9a3412',
                        flexShrink: 0,
                    }}
                >
                    <AlertCircle style={{ width: 13, height: 13, flexShrink: 0 }} />
                    <span>Real-time updates unavailable. Messages refresh every 2 seconds.</span>
                </div>
            )}

            {/* Messages list */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '12px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >
                {isLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <RefreshCw
                            style={{
                                width: 18, height: 18,
                                color: t.cellMuted,
                                animation: 'spin 1s linear infinite',
                            }}
                        />
                    </div>
                ) : messages.length === 0 ? (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            gap: 8,
                        }}
                    >
                        <MessageSquare
                            style={{ width: 28, height: 28, color: t.cellMuted, opacity: 0.35 }}
                        />
                        <p style={{ fontSize: 11, color: t.cellMuted, margin: 0 }}>
                            No messages yet. Start the discussion!
                        </p>
                    </div>
                ) : (
                    grouped.map(group => (
                        <div key={group.date}>
                            {/* Date separator */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    margin: '10px 0 8px',
                                }}
                            >
                                <div style={{ flex: 1, height: 1, background: t.sectionDivider }} />
                                <span
                                    style={{
                                        fontSize: 9,
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '.07em',
                                        color: t.cellMuted,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {group.date}
                                </span>
                                <div style={{ flex: 1, height: 1, background: t.sectionDivider }} />
                            </div>

                            {/* Messages in this date group */}
                            {group.msgs.map(msg => {
                                const isOwn = msg.sender_id === currentUser.id;
                                const avatarUrl = `https://live.adamson.edu.ph/legacy/primarypicavatar/getuserimg_idno.php?x=${msg.sender_id}_2`;
                                return (
                                    <div
                                        key={msg.id}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            alignItems: 'flex-end',
                                            gap: 8,
                                            marginBottom: 10,
                                            flexDirection: isOwn ? 'row-reverse' : 'row',
                                        } as React.CSSProperties}
                                    >
                                        {/* Avatar */}
                                        <img
                                            src={avatarUrl}
                                            alt={msg.sender_name}
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                                border: `2px solid ${isDark ? 'rgba(100,160,255,0.30)' : 'rgba(37,99,235,0.20)'}`,
                                                flexShrink: 0,
                                            }}
                                            onError={e => {
                                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"%3E%3Cpath d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/%3E%3Ccircle cx="12" cy="7" r="4"/%3E%3C/svg%3E';
                                            }}
                                        />

                                        {/* Message content */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: isOwn ? 'flex-end' : 'flex-start',
                                                flex: 1,
                                                minWidth: 0,
                                            }}
                                        >
                                            {/* Sender name — only for others */}
                                            {!isOwn && (
                                                <span
                                                    style={{
                                                        fontSize: 9,
                                                        fontWeight: 700,
                                                        color: t.tableHeadText,
                                                        marginBottom: 3,
                                                        paddingLeft: 2,
                                                        letterSpacing: '.03em',
                                                    }}
                                                >
                                                    {msg.sender_name}
                                                </span>
                                            )}
                                            <div
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: isOwn ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                                                    fontSize: 11,
                                                    lineHeight: 1.55,
                                                    wordBreak: 'break-word',
                                                    background: isOwn
                                                        ? (isDark ? 'rgba(37,99,235,0.55)' : 'rgba(29,78,216,0.88)')
                                                        : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'),
                                                    color: isOwn
                                                        ? '#ffffff'
                                                        : t.cellText,
                                                    border: isOwn
                                                        ? 'none'
                                                        : `1px solid ${t.rowBorder}`,
                                                }}
                                            >
                                                {msg.message}
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: 9,
                                                    color: t.cellMuted,
                                                    marginTop: 3,
                                                    paddingRight: isOwn ? 2 : 0,
                                                    paddingLeft: isOwn ? 0 : 2,
                                                }}
                                            >
                                                {formatTime(msg.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input row */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderTop: `1px solid ${t.cardHeaderBorder}`,
                    background: t.cardHeaderBg,
                    flexShrink: 0,
                }}
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="Type a message…"
                    maxLength={2000}
                    style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 10,
                        border: `1px solid ${t.inputBorder}`,
                        background: t.inputBg,
                        color: t.inputText,
                        fontSize: 11,
                        outline: 'none',
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isSending}
                    style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        border: 'none',
                        background: !inputValue.trim() || isSending
                            ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)')
                            : (isDark ? 'rgba(37,99,235,0.70)' : '#1d4ed8'),
                        color: !inputValue.trim() || isSending
                            ? t.cellMuted
                            : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: !inputValue.trim() || isSending ? 'not-allowed' : 'pointer',
                        transition: 'background .12s ease',
                        flexShrink: 0,
                    }}
                    title="Send (Enter)"
                >
                    {isSending
                        ? <RefreshCw style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                        : <Send style={{ width: 14, height: 14 }} />
                    }
                </button>
            </div>
        </div>
    );
}
export function RSChatBadge({
    onClick,
    unreadCount,
    active = false,
    t,
    isDark,
}: {
    onClick: () => void;
    unreadCount: number;
    active?: boolean;
    t: ThemeTokens;
    isDark: boolean;
}) {
    // Pale-blue palette (shared between active and idle states)
    const paleBlue = {
        idleBg: isDark ? 'rgba(147,197,253,0.10)' : 'rgba(219,234,254,0.55)',
        idleBorder: isDark ? 'rgba(147,197,253,0.30)' : 'rgba(96,165,250,0.40)',
        idleText: isDark ? '#93c5fd' : '#2563eb',
        hoverBg: isDark ? 'rgba(147,197,253,0.20)' : 'rgba(191,219,254,0.80)',
        hoverBorder: isDark ? 'rgba(147,197,253,0.50)' : 'rgba(59,130,246,0.55)',
        activeBg: isDark ? 'rgba(59,130,246,0.28)' : 'rgba(191,219,254,0.95)',
        activeBorder: isDark ? 'rgba(96,165,250,0.65)' : 'rgba(37,99,235,0.55)',
        activeText: isDark ? '#60a5fa' : '#1d4ed8',
    };

    return (
        <div style={{ position: 'relative', display: 'inline-flex' }}>
            <button
                onClick={onClick}
                title={active ? 'Close chat' : 'Open chat'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-150 select-none whitespace-nowrap"
                style={{
                    border: `1px solid ${active ? paleBlue.activeBorder : paleBlue.idleBorder}`,
                    background: active ? paleBlue.activeBg : paleBlue.idleBg,
                    color: active ? paleBlue.activeText : paleBlue.idleText,
                    cursor: 'pointer',
                    flexShrink: 0,
                    boxShadow: active
                        ? (isDark
                            ? '0 0 0 3px rgba(59,130,246,0.18), 0 2px 8px rgba(59,130,246,0.22)'
                            : '0 0 0 3px rgba(37,99,235,0.12), 0 2px 8px rgba(37,99,235,0.14)')
                        : 'none',
                }}
                onMouseEnter={e => {
                    if (!active) {
                        (e.currentTarget as HTMLElement).style.background = paleBlue.hoverBg;
                        (e.currentTarget as HTMLElement).style.borderColor = paleBlue.hoverBorder;
                    }
                }}
                onMouseLeave={e => {
                    if (!active) {
                        (e.currentTarget as HTMLElement).style.background = paleBlue.idleBg;
                        (e.currentTarget as HTMLElement).style.borderColor = paleBlue.idleBorder;
                    }
                }}
            >
                <MessageSquare style={{ width: 14, height: 14, flexShrink: 0 }} />
                <span style={{
                    letterSpacing: '0.01em',
                }}>
                    Chat
                </span>
            </button>

            {/* Unread badge */}
            {unreadCount > 0 && (
                <span
                    style={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        minWidth: 16,
                        height: 16,
                        borderRadius: 8,
                        background: '#ef4444',
                        color: '#ffffff',
                        fontSize: 9,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 3px',
                        border: `2px solid ${isDark ? '#0b1328' : '#ffffff'}`,
                        lineHeight: 1,
                        pointerEvents: 'none',
                    }}
                >
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
        </div>
    );
}
