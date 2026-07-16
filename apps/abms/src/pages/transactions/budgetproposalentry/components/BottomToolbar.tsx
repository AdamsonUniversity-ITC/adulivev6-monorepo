import { Copy, Plus } from 'lucide-react';
import type { ThemeTokens } from '../types';
import { ActionBtn } from './ActionBtn';

interface BottomToolbarProps {
    grandTotal: number;
    isLoaded: boolean;
    isSaving: boolean;
    isCopying: boolean;
    isWithinEntryPeriod: boolean;
    onAddRow: () => void;
    onCopyPrevious: () => void;
    t: ThemeTokens;
}

export function BottomToolbar({ grandTotal, isLoaded, isSaving, isCopying, isWithinEntryPeriod, onAddRow, onCopyPrevious, t }: BottomToolbarProps) {
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
                <ActionBtn token={t.btnAdd} icon={<Plus className="w-4 h-4" />} label="Add Row" onClick={onAddRow} disabled={!isLoaded || !isWithinEntryPeriod || isSaving} t={t} />
                <ActionBtn token={t.btnCopy} icon={<Copy className="w-4 h-4" />} label="Copy Previous Budget Proposal" onClick={onCopyPrevious} loading={isCopying} disabled={!isLoaded || !isWithinEntryPeriod || isSaving || isCopying} t={t} />
            </div>

            <div className="flex items-center gap-3 rounded-lg px-4 py-2.5" style={{ background: t.totalBg, border: `1px solid ${t.totalBorder}`, backdropFilter: 'blur(6px)' }}>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: t.totalLabelText }}>Total</span>
                <div className="h-4 w-px" style={{ background: t.totalBorder }} />
                <span className="text-sm font-semibold font-mono min-w-[140px] text-right" style={{ color: t.totalText }}>
                    PHP {grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
            </div>
        </div>
    );
}
