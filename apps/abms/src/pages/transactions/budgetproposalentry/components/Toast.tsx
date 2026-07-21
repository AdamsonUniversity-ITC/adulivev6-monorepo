import { useEffect, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';
import type { ToastState, ToastType } from '../types';

const TOAST_STYLES: Record<ToastType, {
    dark: { bg: string; border: string; text: string; shadow: string };
    light: { bg: string; border: string; text: string; shadow: string };
    icon: ReactNode;
}> = {
    success: {
        dark: { bg: 'rgba(21,128,61,0.22)', border: 'rgba(34,197,94,0.40)', text: '#4ade80', shadow: '0 8px 32px rgba(21,128,61,0.25)' },
        light: { bg: 'rgba(220,252,231,1)', border: 'rgba(22,163,74,0.50)', text: '#15803d', shadow: '0 8px 32px rgba(22,163,74,0.18)' },
        icon: <CheckCircle2 className="w-4 h-4 shrink-0" />,
    },
    info: {
        dark: { bg: 'rgba(37,99,235,0.20)', border: 'rgba(59,130,246,0.40)', text: '#60a5fa', shadow: '0 8px 32px rgba(37,99,235,0.25)' },
        light: { bg: 'rgba(219,234,254,1)', border: 'rgba(37,99,235,0.45)', text: '#1d4ed8', shadow: '0 8px 32px rgba(37,99,235,0.18)' },
        icon: <Info className="w-4 h-4 shrink-0" />,
    },
    error: {
        dark: { bg: 'rgba(185,28,28,0.22)', border: 'rgba(239,68,68,0.40)', text: '#f87171', shadow: '0 8px 32px rgba(185,28,28,0.25)' },
        light: { bg: 'rgba(254,226,226,1)', border: 'rgba(220,38,38,0.45)', text: '#b91c1c', shadow: '0 8px 32px rgba(220,38,38,0.18)' },
        icon: <AlertCircle className="w-4 h-4 shrink-0" />,
    },
};

export function Toast({ toast, onClose, isDark }: { toast: ToastState; onClose: () => void; isDark: boolean }) {
    useEffect(() => {
        if (!toast.visible) return;
        const timer = setTimeout(onClose, 3500);
        return () => clearTimeout(timer);
    }, [toast.visible, toast.message, onClose]);

    if (!toast.visible) return null;

    const style = TOAST_STYLES[toast.type];
    const s = isDark ? style.dark : style.light;

    return (
        <div
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold"
            style={{
                background: s.bg,
                border: `1px solid ${s.border}`,
                color: s.text,
                boxShadow: s.shadow,
                backdropFilter: 'blur(12px)',
                minWidth: '260px',
                maxWidth: '360px',
                animation: 'slideInToast 0.25s ease-out',
            }}
        >
            <style>{`
                @keyframes slideInToast {
                    from { opacity: 0; transform: translateY(12px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0)     scale(1);    }
                }
            `}</style>
            {style.icon}
            <span className="flex-1">{toast.message}</span>
            <button onClick={onClose} className="ml-1 opacity-50 hover:opacity-100 transition-opacity" style={{ color: s.text }}>
                <XCircle className="w-4 h-4" />
            </button>
        </div>
    );
}
