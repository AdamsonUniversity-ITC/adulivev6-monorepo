interface UnreadChatBadgeProps {
    count: number;
}

export function UnreadChatBadge({ count }: UnreadChatBadgeProps) {
    if (count <= 0) return null;

    const label = count > 99 ? '99+' : String(count);
    return (
        <span
            aria-label={`${count} unread chat ${count === 1 ? 'message' : 'messages'}`}
            title={`${count} unread chat ${count === 1 ? 'message' : 'messages'}`}
            className="pointer-events-none absolute -right-1.5 -top-1.5 z-[2] inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[9px] font-extrabold leading-none text-white shadow-sm dark:border-slate-900"
        >
            {label}
        </span>
    );
}
