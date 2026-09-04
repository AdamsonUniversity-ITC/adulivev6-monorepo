import { RefreshCw, SlidersHorizontal } from 'lucide-react';
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
    requeryReady: boolean;
    isQuerying: boolean;
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
        requeryReady,
        isQuerying,
        t,
        isDark,
    } = props;

    return (
        <section className="budget-proposal-filter space-y-5 rounded-2xl border p-5" style={{ background: t.cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow }}>
            <div className="flex items-start gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border" style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.tableHeadText }}><SlidersHorizontal className="h-5 w-5" /></span>
                <div><h2 className="text-lg font-bold" style={{ color: t.cardTitleColor }}>Proposal filters</h2><p className="mt-1 text-sm leading-6" style={{ color: t.cellMuted }}>Select the organizational unit and account scope, then load the proposal.</p></div>
            </div>
            <div className="grid min-w-0 grid-cols-1 items-end gap-4 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_auto]">
                <div className="min-w-0 space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--abms-text-soft)' }}>Department / Section</label>
                    <DeptSelect value={selectedDept} valueKind={selectedDeptKind} onChange={onDeptChange} departments={departments} sections={sections} t={t} isDark={isDark} />
                </div>
                <div className="min-w-0 space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--abms-text-soft)' }}>Main Account</label>
                    <StyledSelect value={selectedMain} onChange={onMainChange} options={mainAccountOptions} placeholder="Select main account..." t={t} isDark={isDark} />
                </div>
                <div className="min-w-0 space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--abms-text-soft)' }}>Sub Account</label>
                    <StyledSelect
                        value={selectedSub}
                        onChange={onSubChange}
                        options={filteredSubAccountOptions}
                        placeholder={selectedMain ? 'Select sub account...' : 'Select main account first...'}
                        disabled={!selectedMain}
                        t={t}
                        isDark={isDark}
                    />
                </div>
                <div className="flex md:col-span-2 xl:col-span-1 [&>button]:w-full [&>button]:justify-center xl:[&>button]:min-w-40"><ActionBtn token={t.btnRequery} icon={<RefreshCw className="w-5 h-5" />} label="Requery" onClick={onRequery} disabled={!requeryReady || isQuerying} loading={isQuerying} t={t} /></div>
            </div>
        </section>
    );
}
