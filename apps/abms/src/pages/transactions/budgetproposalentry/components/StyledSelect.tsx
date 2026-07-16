import { ChevronDown } from 'lucide-react';
import type { AccountOption, ThemeTokens } from '../types';

interface StyledSelectProps {
    value: string;
    onChange: (v: string) => void;
    options: AccountOption[];
    placeholder: string;
    disabled?: boolean;
    t: ThemeTokens;
}

export function StyledSelect({ value, onChange, options, placeholder, disabled = false, t }: StyledSelectProps) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                disabled={disabled}
                className="w-full appearance-none rounded-md text-sm px-3 py-2 pr-8 outline-none transition-all duration-150"
                style={{
                    background: t.inputBg,
                    border: `1px solid ${t.inputBorder}`,
                    color: value ? t.inputText : 'var(--abms-text-muted)',
                    backdropFilter: 'blur(6px)',
                    opacity: disabled ? 0.72 : 1,
                    cursor: disabled ? 'not-allowed' : 'default',
                }}
            >
                <option value="">{placeholder}</option>
                {options.map(o => (
                    <option key={o.value} value={o.value} style={{ background: '#0f172a', color: '#e2e8f0' }}>
                        {o.label}
                    </option>
                ))}
            </select>
            <ChevronDown
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                style={{ color: t.tableHeadText }}
            />
        </div>
    );
}
