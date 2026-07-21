import { useState, type ReactNode } from 'react';
import type { BtnToken, ThemeTokens } from '../types';

interface ActionBtnProps {
    token: BtnToken;
    icon: ReactNode;
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    t: ThemeTokens;
}

export function ActionBtn({ token, icon, label, onClick, disabled = false, loading = false, t }: ActionBtnProps) {
    const [hovered, setHovered] = useState(false);

    return (
        <button
            onClick={!disabled && !loading ? onClick : undefined}
            onMouseEnter={() => !disabled && !loading && setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="flex min-h-9 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all duration-150 select-none"
            style={{
                background: disabled ? t.btnDisabledBg : hovered ? token.hover : token.bg,
                borderColor: disabled ? t.btnDisabledBorder : token.border,
                color: disabled ? t.btnDisabledText : token.text,
                minWidth: '60px',
                cursor: disabled || loading ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.72 : 1,
            }}
        >
            <span className={loading ? 'animate-spin' : ''}>{icon}</span>
            {label}
        </button>
    );
}
