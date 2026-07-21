import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Theme } from '../types';

interface FilterComboboxProps {
    items: string[];
    value: string;
    selected: string | null;
    open: boolean;
    placeholder?: string;
    onInputChange: (v: string) => void;
    onFocus: () => void;
    onBlur: () => void;
    onSelect: (item: string) => void;
    t: Theme;
    minWidth?: number;
    maxWidth?: number;
}

export function FilterCombobox({
    items, value, selected, open, placeholder = 'Search…',
    onInputChange, onFocus, onBlur, onSelect, t,
    minWidth = 200, maxWidth = 260,
}: FilterComboboxProps) {
    const inputStyle: React.CSSProperties = {
        background: t.inputBg,
        border: `1px solid ${t.inputBorder}`,
        borderRadius: 7,
        padding: '6px 30px 6px 10px',
        fontSize: 11,
        color: t.inputText,
        outline: 'none',
        width: '100%',
        cursor: 'text',
    };

    return (
        <div style={{ position: 'relative', minWidth, maxWidth, flex: '1 1 auto' }}>
            <input
                style={inputStyle}
                placeholder={placeholder}
                value={value}
                onChange={e => onInputChange(e.target.value)}
                onFocus={onFocus}
                onBlur={onBlur}
            />
            <ChevronDown
                style={{
                    position: 'absolute', right: 8, top: '50%',
                    transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
                    width: 13, height: 13, color: t.cellMuted,
                    pointerEvents: 'none',
                    transition: 'transform .15s ease',
                }}
            />
            {open && items.length > 0 && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        background: t.dropdownBg,
                        border: `1px solid ${t.cardBorder}`,
                        borderRadius: 8,
                        zIndex: 50,
                        maxHeight: 180,
                        overflowY: 'auto',
                        boxShadow: t.cardShadow,
                    }}
                >
                    {items.map(item => (
                        <div
                            key={item}
                            onMouseDown={() => onSelect(item)}
                            style={{
                                padding: '7px 12px',
                                fontSize: 11,
                                color: selected === item ? t.accentColor : t.cellText,
                                background: selected === item ? t.dropdownSelected : 'transparent',
                                cursor: 'pointer',
                                transition: 'background .1s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = t.dropdownHover)}
                            onMouseLeave={e => (e.currentTarget.style.background = selected === item ? t.dropdownSelected : 'transparent')}
                        >
                            {item}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}