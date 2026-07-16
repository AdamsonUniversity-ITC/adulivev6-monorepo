import { RefreshCw, Save, XCircle } from 'lucide-react';
import type { AccountOption, DeptOption, ThemeTokens } from '../types';
import { ActionBtn } from './ActionBtn';
import { DeptSelect } from './DeptSelect';
import { StyledSelect } from './StyledSelect';

interface FilterPanelProps {
    selectedDept: string;
    selectedDeptKind: 'Department' | 'Section' | '';
    selectedMain: string;
    selectedSub: string;
    departments: DeptOption[];
    sections: DeptOption[];
    mainAccountOptions: AccountOption[];
    filteredSubAccountOptions: AccountOption[];
    onDeptChange: (id: string, kind: 'Department' | 'Section') => void;
    onMainChange: (value: string) => void;
    onSubChange: (value: string) => void;
    onRequery: () => void;
    onSave: () => void;
    onCancel: () => void;
    requeryReady: boolean;
    isQuerying: boolean;
    isSaving: boolean;
    isLoaded: boolean;
    isWithinEntryPeriod: boolean;
    t: ThemeTokens;
    isDark: boolean;
}

export function FilterPanel(props: FilterPanelProps) {
    const {
        selectedDept,
        selectedDeptKind,
        selectedMain,
        selectedSub,
        departments,
        sections,
        mainAccountOptions,
        filteredSubAccountOptions,
        onDeptChange,
        onMainChange,
        onSubChange,
        onRequery,
        onSave,
        onCancel,
        requeryReady,
        isQuerying,
        isSaving,
        isLoaded,
        isWithinEntryPeriod,
        t,
        isDark,
    } = props;

    return (
        <div className="space-y-3 rounded-xl border p-3" style={{ background: t.inputBg, borderColor: t.inputBorder }}>
            <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-3">
                <div className="min-w-0 space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--abms-text-soft)' }}>Department / Section</label>
                    <DeptSelect value={selectedDept} valueKind={selectedDeptKind} onChange={onDeptChange} departments={departments} sections={sections} t={t} isDark={isDark} />
                </div>
                <div className="min-w-0 space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--abms-text-soft)' }}>Main Account</label>
                    <StyledSelect value={selectedMain} onChange={onMainChange} options={mainAccountOptions} placeholder="Select main account..." t={t} />
                </div>
                <div className="min-w-0 space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--abms-text-soft)' }}>Sub Account</label>
                    <StyledSelect
                        value={selectedSub}
                        onChange={onSubChange}
                        options={filteredSubAccountOptions}
                        placeholder={selectedMain ? 'Select sub account...' : 'Select main account first...'}
                        disabled={!selectedMain}
                        t={t}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-2 border-t pt-3 sm:grid-cols-3" style={{ borderColor: t.divider }}>
                <div className="flex [&>button]:w-full [&>button]:justify-center"><ActionBtn token={t.btnRequery} icon={<RefreshCw className="w-4 h-4" />} label="Requery" onClick={onRequery} disabled={!requeryReady || isQuerying} loading={isQuerying} t={t} /></div>
                <div className="flex [&>button]:w-full [&>button]:justify-center"><ActionBtn token={t.btnSave} icon={<Save className="w-4 h-4" />} label="Save" onClick={onSave} loading={isSaving} disabled={!isLoaded || !isWithinEntryPeriod || isSaving} t={t} /></div>
                <div className="flex [&>button]:w-full [&>button]:justify-center"><ActionBtn token={t.btnCancel} icon={<XCircle className="w-4 h-4" />} label="Cancel" onClick={onCancel} disabled={!isLoaded || !isWithinEntryPeriod || isSaving} t={t} /></div>
            </div>
        </div>
    );
}
