import { useState } from 'react';
import { Card, CardContent } from '@repo/ui/components/card';
import { financeSvc } from '@repo/axios-config';
import AdamsonBudgetLayout from '../../../layouts/Screenlayout.tsx';
import { budgetproposalentryRoute } from '../../../router.tsx';
import { saveSchema } from './schemas';
import { T } from './theme';
import type { AccountOption, DeptOption, LineItem, MainAccount, SubAccount, ToastState, ToastType } from './types';
import { isEntryPeriodOpen, mapApiItemToCopiedLineItem, mapApiItemToLineItem } from './utils';
import { BottomToolbar } from './components/BottomToolbar';
import { EntryPeriodBanner } from './components/EntryPeriodBanner';
import { FilterPanel } from './components/FilterPanel';
import { LineItemsTable } from './components/LineItemsTable';
import { PageCardHeader, PageTitle } from './components/PageHeader';
import { Toast } from './components/Toast';

export default function BudgetProposalEntry() {
    const { data } = budgetproposalentryRoute.useLoaderData() || {};
    const { user } = budgetproposalentryRoute.useRouteContext();
    const sy: string = data?.school_year ?? '-';
    const departments: DeptOption[] = (data?.departments ?? []) as DeptOption[];
    const sections: DeptOption[] = (data?.sections ?? []) as DeptOption[];
    const mainAccounts: MainAccount[] = (data?.mainaccounts ?? []) as MainAccount[];
    const subAccounts: SubAccount[] = (data?.subaccounts ?? []) as SubAccount[];

    const entryFrom: string = data?.entryfrom ?? '';
    const entryTo: string = data?.entryto ?? '';
    const isWithinEntryPeriod = isEntryPeriodOpen(entryFrom, entryTo);

    const [selectedDept, setSelectedDept] = useState('');
    const [selectedDeptKind, setSelectedDeptKind] = useState<'Department' | 'Section' | ''>('');
    const [selectedMain, setSelectedMain] = useState('');
    const [selectedSub, setSelectedSub] = useState('');

    const [rows, setRows] = useState<LineItem[]>([]);
    const [originalRows, setOriginalRows] = useState<LineItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isQuerying, setIsQuerying] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'info' });

    const showToast = (message: string, type: ToastType) => setToast({ visible: true, message, type });

    const resetState = () => {
        setIsLoaded(false);
        setRows([]);
    };

    const handleDeptChange = (id: string, kind: 'Department' | 'Section') => {
        setSelectedDept(id);
        setSelectedDeptKind(kind);
        resetState();
    };

    const handleMainChange = (value: string) => {
        setSelectedMain(value);
        setSelectedSub('');
        resetState();
    };

    const mainAccountOptions: AccountOption[] = mainAccounts.map(account => ({
        value: String(account.id),
        label: `${account.account_code} - ${account.account_name}`,
    }));

    const filteredSubAccountOptions: AccountOption[] = subAccounts
        .filter(account => account.parent_id === Number(selectedMain))
        .map(account => ({
            value: String(account.id),
            label: `${account.account_code} - ${account.account_name}`,
        }));

    const handleRequery = async () => {
        if (!selectedDept || !selectedMain || !selectedSub) return;

        setIsQuerying(true);
        setIsLoaded(false);
        setRows([]);

        try {
            const { data: result } = await financeSvc.post('/abms/budget-proposal-entry/requery', {
                school_year: sy,
                department_id: selectedDept,
                kind: selectedDeptKind,
                main_account_id: Number(selectedMain),
                sub_account_id: Number(selectedSub),
            });

            const mapped = (result.items ?? []).map(mapApiItemToLineItem);
            setRows(mapped);
            setOriginalRows(mapped);
            setIsLoaded(true);

            showToast(
                mapped.length > 0
                    ? `Loaded ${mapped.length} item${mapped.length > 1 ? 's' : ''} successfully.`
                    : 'No existing entries found. You can start adding rows.',
                mapped.length > 0 ? 'success' : 'info',
            );
        } catch (err) {
            console.error('Requery failed:', err);
            showToast('Failed to load data. Please try again.', 'error');
        } finally {
            setIsQuerying(false);
        }
    };

    const handleAddRow = () => {
        setRows(prev => [
            ...prev,
            { id: Date.now(), isNew: true, description: '', unitCost: '', quantity: '', uom: '', totalAmount: '' },
        ]);
    };

    const handleRemoveRow = (id: number) => {
        setRows(prev => prev.filter(row => row.id !== id));
    };

    const handleCancel = () => {
        setRows(originalRows);
        showToast('Changes discarded.', 'info');
    };

    const handleSave = async () => {
        if (!isLoaded || !isWithinEntryPeriod) return;

        const payload = {
            school_year: sy,
            user_id: user.username,
            department_id: selectedDept,
            kind: selectedDeptKind as 'Department' | 'Section',
            main_account_id: Number(selectedMain),
            sub_account_id: Number(selectedSub),
            existing_ids: originalRows.filter(row => !row.isNew).map(row => row.id),
            rows: rows.map(row => ({
                id: row.isNew ? null : row.id,
                item_name: row.description,
                unit_cost: parseFloat(row.unitCost) || 0,
                quantity: parseFloat(row.quantity) || 0,
                unit_measurement: row.uom,
                total_cost: parseFloat(row.totalAmount) || 0,
            })),
        };

        const result = saveSchema.safeParse(payload);
        if (!result.success) {
            const errors = result.error.errors;
            const rowErrors = errors.filter(error => error.path[0] === 'rows');
            const topErrors = errors.filter(error => error.path[0] !== 'rows');

            if (rowErrors.length > 0) {
                const badRows = [...new Set(rowErrors.map(error => (error.path[1] as number) + 1))];
                const fieldMessages = [...new Set(rowErrors.map(error => error.message))];
                showToast(`Row${badRows.length > 1 ? 's' : ''} ${badRows.join(', ')}: ${fieldMessages[0]}`, 'error');
            } else {
                showToast(topErrors[0]?.message ?? 'Validation failed.', 'error');
            }
            return;
        }

        setIsSaving(true);
        try {
            const { data: saveResult } = await financeSvc.post('/abms/budget-proposal-entry/save', result.data);
            const saved = rows.map((row, index) => ({ ...row, id: saveResult.ids[index] ?? row.id, isNew: false }));
            setRows(saved);
            setOriginalRows(saved);
            showToast('Budget proposal saved successfully.', 'success');
        } catch (err) {
            console.error('Save failed:', err);
            showToast('Failed to save. Please try again.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopyPrevious = async () => {
        if (!isLoaded || !isWithinEntryPeriod || !selectedDeptKind) return;

        setIsCopying(true);
        try {
            const { data: result } = await financeSvc.post('/abms/budget-proposal-entry/copy-previous', {
                school_year: sy,
                department_id: selectedDept,
                kind: selectedDeptKind,
                main_account_id: Number(selectedMain),
                sub_account_id: Number(selectedSub),
            });

            const copied = (result.items ?? []).map(mapApiItemToCopiedLineItem);
            if (copied.length === 0) {
                showToast(`No entries found for ${result.previous_school_year}.`, 'info');
                return;
            }

            setRows(prev => [...prev, ...copied]);
            showToast(`Copied ${copied.length} item${copied.length > 1 ? 's' : ''} from ${result.previous_school_year}.`, 'success');
        } catch (err) {
            console.error('Copy previous failed:', err);
            showToast('Failed to copy previous entries. Please try again.', 'error');
        } finally {
            setIsCopying(false);
        }
    };

    const updateRow = (id: number, field: keyof LineItem, value: string) => {
        setRows(prev =>
            prev.map(row => {
                if (row.id !== id) return row;

                const updated = { ...row, [field]: value };
                const cost = parseFloat(updated.unitCost) || 0;
                const qty = parseFloat(updated.quantity) || 0;
                updated.totalAmount = cost > 0 && qty > 0 ? (cost * qty).toFixed(2) : '';
                return updated;
            }),
        );
    };

    const grandTotal = rows.reduce((sum, row) => sum + (parseFloat(row.totalAmount) || 0), 0);
    const requeryReady = !!(selectedDept && selectedMain && selectedSub);

    return (
        <AdamsonBudgetLayout>
            {(isDark: boolean) => {
                const t = isDark ? T.dark : T.light;

                return (
                    <>
                        <div className="max-w-7xl mx-auto space-y-4">
                            <PageTitle sy={sy} t={t} />
                            <Card className="overflow-hidden backdrop-blur-sm" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow }}>
                                <PageCardHeader sy={sy} selectedDeptKind={selectedDeptKind} t={t} />
                                <CardContent className="space-y-4 p-4">
                                    <FilterPanel
                                        selectedDept={selectedDept}
                                        selectedDeptKind={selectedDeptKind}
                                        selectedMain={selectedMain}
                                        selectedSub={selectedSub}
                                        departments={departments}
                                        sections={sections}
                                        mainAccountOptions={mainAccountOptions}
                                        filteredSubAccountOptions={filteredSubAccountOptions}
                                        onDeptChange={handleDeptChange}
                                        onMainChange={handleMainChange}
                                        onSubChange={value => { setSelectedSub(value); resetState(); }}
                                        onRequery={handleRequery}
                                        onSave={handleSave}
                                        onCancel={handleCancel}
                                        requeryReady={requeryReady}
                                        isQuerying={isQuerying}
                                        isSaving={isSaving}
                                        isLoaded={isLoaded}
                                        isWithinEntryPeriod={isWithinEntryPeriod}
                                        t={t}
                                        isDark={isDark}
                                    />

                                    {!isWithinEntryPeriod && <EntryPeriodBanner entryFrom={entryFrom} entryTo={entryTo} isDark={isDark} />}

                                    <LineItemsTable
                                        rows={rows}
                                        isLoaded={isLoaded}
                                        isSaving={isSaving}
                                        isWithinEntryPeriod={isWithinEntryPeriod}
                                        onRemoveRow={handleRemoveRow}
                                        onUpdateRow={updateRow}
                                        t={t}
                                    />

                                    <BottomToolbar
                                        grandTotal={grandTotal}
                                        isLoaded={isLoaded}
                                        isSaving={isSaving}
                                        isCopying={isCopying}
                                        isWithinEntryPeriod={isWithinEntryPeriod}
                                        onAddRow={handleAddRow}
                                        onCopyPrevious={handleCopyPrevious}
                                        t={t}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        <Toast toast={toast} onClose={() => setToast(current => ({ ...current, visible: false }))} isDark={isDark} />
                    </>
                );
            }}
        </AdamsonBudgetLayout>
    );
}
