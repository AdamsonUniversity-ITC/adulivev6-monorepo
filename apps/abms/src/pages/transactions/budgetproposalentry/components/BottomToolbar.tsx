import { Copy, Plus, Save, XCircle } from 'lucide-react';
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
    onSave: () => void;
    onCancel: () => void;
    t: ThemeTokens;
}

export function BottomToolbar({ grandTotal, isLoaded, isSaving, isCopying, isWithinEntryPeriod, onAddRow, onCopyPrevious, onSave, onCancel, t }: BottomToolbarProps) {
    return (
        <div className="flex flex-col gap-4 border-t p-4 lg:flex-row lg:items-center lg:justify-between" style={{ borderColor: t.divider, background: t.cardHeaderBg }}>
            <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
                <ActionBtn token={t.btnAdd} icon={<Plus className="w-4 h-4" />} label="Add Row" onClick={onAddRow} disabled={!isLoaded || !isWithinEntryPeriod || isSaving} t={t} />
                <ActionBtn token={t.btnCopy} icon={<Copy className="w-4 h-4" />} label="Copy Previous Budget Proposal" onClick={onCopyPrevious} loading={isCopying} disabled={!isLoaded || !isWithinEntryPeriod || isSaving || isCopying} t={t} />
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:w-auto">
            <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-4 py-2.5 sm:justify-start" style={{ background: t.totalBg, border: `1px solid ${t.totalBorder}`, backdropFilter: 'blur(6px)' }}>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: t.totalLabelText }}>Total</span>
                <div className="h-4 w-px" style={{ background: t.totalBorder }} />
                <span className="text-sm font-semibold font-mono min-w-[140px] text-right" style={{ color: t.totalText }}>
                    PHP {grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-2"><ActionBtn token={t.btnCancel} icon={<XCircle className="h-5 w-5" />} label="Cancel" onClick={onCancel} disabled={!isLoaded || !isWithinEntryPeriod || isSaving} t={t} /><ActionBtn token={t.btnSave} icon={<Save className="h-5 w-5" />} label="Save" onClick={onSave} loading={isSaving} disabled={!isLoaded || !isWithinEntryPeriod || isSaving} t={t} /></div>
            </div>
        </div>
    );
}
