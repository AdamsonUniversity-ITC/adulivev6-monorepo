import React from 'react';
import { ChevronDown, ArrowUpDown, LucideIcon } from 'lucide-react';
import { Theme } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// FilterSortDropdown
// ─────────────────────────────────────────────────────────────────────────────
interface FilterSortDropdownProps {
    columns: string[];
    value: string;
    open: boolean;
    onToggle: () => void;
    onSelect: (col: string) => void;
    t: Theme;
}

export function FilterSortDropdown({ columns, value, open, onToggle, onSelect, t }: FilterSortDropdownProps) {
    const inputStyle: React.CSSProperties = {
        background: t.inputBg,
        border: `1px solid ${t.inputBorder}`,
        borderRadius: 7,
        padding: '6px 30px 6px 10px',
        fontSize: 11,
        color: t.inputText,
        outline: 'none',
        cursor: 'pointer',
    };

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <button
                onClick={onToggle}
                style={{
                    ...inputStyle,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    paddingLeft: 10,
                    paddingRight: 28,
                    minWidth: 120,
                    width: '100%',
                }}
            >
                <ArrowUpDown style={{ width: 10, height: 10, color: t.cellMuted, flexShrink: 0 }} />
                <span style={{ fontSize: 11 }}>{value}</span>
            </button>
            <ChevronDown
                style={{
                    position: 'absolute', right: 8, top: '50%',
                    transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
                    width: 12, height: 12, color: t.cellMuted,
                    pointerEvents: 'none',
                    transition: 'transform .15s ease',
                }}
            />
            {open && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        background: t.dropdownBg,
                        border: `1px solid ${t.cardBorder}`,
                        borderRadius: 8,
                        zIndex: 50,
                        minWidth: 130,
                        boxShadow: t.cardShadow,
                    }}
                >
                    {columns.map(col => (
                        <div
                            key={col}
                            onMouseDown={() => onSelect(col)}
                            style={{
                                padding: '7px 12px',
                                fontSize: 11,
                                color: value === col ? t.accentColor : t.cellText,
                                background: value === col ? t.dropdownSelected : 'transparent',
                                cursor: 'pointer',
                                transition: 'background .1s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = t.dropdownHover)}
                            onMouseLeave={e => (e.currentTarget.style.background = value === col ? t.dropdownSelected : 'transparent')}
                        >
                            {col}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// FilterActionButton
// ─────────────────────────────────────────────────────────────────────────────
interface FilterActionButtonProps {
    label: string;
    icon: LucideIcon;
    variant?: 'secondary' | 'primary';
    onClick?: () => void;
    t: Theme;
}

export function FilterActionButton({ label, icon: Icon, variant = 'secondary', onClick, t }: FilterActionButtonProps) {
    const style = variant === 'primary' ? t.btnPrimary : t.btnRefresh;
    return (
        <button
            onClick={onClick}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 13px',
                borderRadius: 7,
                fontSize: 11,
                fontWeight: 700,
                border: `1px solid ${style.border}`,
                background: style.bg,
                color: style.text,
                cursor: 'pointer',
                transition: 'background .14s ease',
                whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = style.hover)}
            onMouseLeave={e => (e.currentTarget.style.background = style.bg)}
        >
            <Icon style={{ width: 11, height: 11 }} />
            {label}
        </button>
    );
}
