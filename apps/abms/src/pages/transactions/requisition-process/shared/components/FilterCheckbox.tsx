import React from 'react';
import { Theme } from '../types';

interface FilterCheckboxProps {
    id: string;
    checked: boolean;
    onChange: (next: boolean) => void;
    label: string;
    t: Theme;
}

export function FilterCheckbox({ id, checked, onChange, label, t }: FilterCheckboxProps) {
    return (
        <label
            htmlFor={id}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                userSelect: 'none',
                fontSize: 13,
                fontWeight: checked ? 600 : 400,
                color: checked ? t.accentColor : t.cellText,
                transition: 'color .12s ease',
                whiteSpace: 'nowrap',
            }}
        >
            <span
                id={id}
                role="checkbox"
                aria-checked={checked}
                tabIndex={0}
                onClick={() => onChange(!checked)}
                onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && onChange(!checked)}
                style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border: `1.5px solid ${checked ? t.accentColor : t.checkboxBorder}`,
                    background: checked ? t.accentColor : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all .12s ease',
                    outline: 'none',
                }}
            >
                {checked && (
                    <svg width="10" height="10" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3.2 5.8L6.5 2.2" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </span>
            <span onClick={() => onChange(!checked)}>{label}</span>
        </label>
    );
}
