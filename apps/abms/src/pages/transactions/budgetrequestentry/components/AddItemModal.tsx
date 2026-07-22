import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { z } from 'zod';
import { AlertCircle, Search, X, ClipboardList, RefreshCw, Save } from 'lucide-react';
import type { RSFormItem, ThemeTokens } from '../types';
import { SelectAccountModal } from './SelectAccountModal';
import { SelectSupplyModal } from './SelectSupplyModal';
import type { RSType, SupplyItem, AccountOption } from '../types';
import { financeSvc } from '@repo/axios-config';
import { fmtCurrency } from '../utils';

export interface AddItemFormState {
    accountId: number | null;
    accountNo: string;
    accountName: string;
    accountParentId: string;
    balance: string;
    itemDescription: string;
    unitCost: string;
    quantity: string;
    unitOfMeasurement: string;
    officeSupplyId: number | null;
}

export const EMPTY_ITEM_FORM: AddItemFormState = {
    accountId: null,
    accountNo: '',
    accountName: '',
    accountParentId: '',
    balance: '',
    itemDescription: '',
    unitCost: '',
    quantity: '',
    unitOfMeasurement: '',
    officeSupplyId: null,
};

// ── Zod schema for AddItemModal client-side validation ────────────────────────
// balance_cap is not a form field — it's validated contextually inside handleSave
export const addItemSchema = z.object({
    accountId: z.number({ invalid_type_error: 'Please select an account first.' }),
    accountNo: z.string().min(1, 'Please select an account first.'),
    accountName: z.string(),
    accountParentId: z.string().min(1, 'Please select an account first.'),
    balance: z.string(),
    itemDescription: z.string().min(1, 'Item description is required.'),
    unitCost: z.coerce
        .number({ invalid_type_error: 'Unit cost must be a number.' })
        .positive('Enter a valid unit cost greater than 0.'),
    quantity: z.coerce
        .number({ invalid_type_error: 'Quantity must be a number.' })
        .positive('Enter a valid quantity greater than 0.')
        .int('Quantity must be a whole number.'),
    unitOfMeasurement: z.string().min(1, 'Unit of measurement is required.'),
});

export type AddItemSchemaErrors = Partial<Record<keyof AddItemFormState | 'balance_cap', string>>;

export function AddItemModal({
    open, onClose, onSave, t, isDark,
    departmentId, sectionId, currentSchoolYear, rsHeaderId, rsType,
}: {
    open: boolean;
    onClose: () => void;
    onSave: (item: RSFormItem) => void;
    t: ThemeTokens;
    isDark: boolean;
    departmentId: string;
    sectionId: string;
    currentSchoolYear: string;
    rsHeaderId: number | null;
    rsType?: RSType;
}) {
    const [form, setForm] = useState<AddItemFormState>(EMPTY_ITEM_FORM);
    // Preserved form while pickers are open
    const savedFormRef = useRef<AddItemFormState>(EMPTY_ITEM_FORM);
    const [showSupplyPicker, setShowSupplyPicker] = useState(false);
    const [showAccountPicker, setShowAccountPicker] = useState(false);
    const [itemFromSupply, setItemFromSupply] = useState(false);
    const [errors, setErrors] = useState<AddItemSchemaErrors>({});

    // Derived: account has been chosen
    const accountSelected = !!form.accountNo;

    useEffect(() => {
        if (open) {
            setForm(EMPTY_ITEM_FORM);
            setShowSupplyPicker(false);
            setShowAccountPicker(false);
            setItemFromSupply(false);
            setErrors({});
        }
    }, [open]);

    // When "Get Items" is clicked: save current form state, hide AddItem, show supply picker
    function handleOpenSupplyPicker() {
        savedFormRef.current = form;
        setShowSupplyPicker(true);
    }

    // When user selects a supply item: close picker, restore form + fill fields
    function handleSupplySelect(item: SupplyItem) {
        setForm({
            ...savedFormRef.current,
            itemDescription: item.item_name,
            unitCost: item.unit_cost,
            unitOfMeasurement: item.unit_measurement,
            officeSupplyId: item.id,
        });
        setItemFromSupply(true);
        setShowSupplyPicker(false);
    }

    // When picker is closed without selection: restore form, hide picker
    function handleSupplyClose() {
        setForm(savedFormRef.current);
        setShowSupplyPicker(false);
    }

    // Account picker handlers
    function handleOpenAccountPicker() {
        savedFormRef.current = form;
        setShowAccountPicker(true);
    }

    function handleAccountSelect(item: AccountOption) {
        setForm(prev => ({
            ...prev,
            accountId: item.account_id,
            accountNo: item.account_code,
            accountName: item.account_name,
            accountParentId: String(item.account_parent_id),
            balance: String(item.balance),
        }));
        // Clear account-related errors and the balance cap error when a new account is picked
        setErrors(prev => {
            const next = { ...prev };
            delete next.accountId;
            delete next.accountNo;
            delete next.balance_cap;
            return next;
        });
        setShowAccountPicker(false);
    }

    const uc = parseFloat(form.unitCost) || 0;
    const qty = parseFloat(form.quantity) || 0;
    const totalAmount = uc * qty;

    function set(field: keyof AddItemFormState, value: string) {
        setForm(prev => ({ ...prev, [field]: value }));
        // Clear the error for this field as the user types
        setErrors(prev => { const next = { ...prev }; delete next[field]; delete next.balance_cap; return next; });
    }

    const [isSaving, setIsSaving] = useState(false);

    async function handleSave() {
        if (rsType === 'stockroom' && !form.officeSupplyId) {
            setErrors({ itemDescription: 'Select an item from the Stockroom list.' });
            return;
        }

        const result = addItemSchema.safeParse(form);

        if (!result.success) {
            const fieldErrors: AddItemSchemaErrors = {};
            for (const issue of result.error.issues) {
                const field = issue.path[0] as keyof AddItemFormState;
                if (!fieldErrors[field]) fieldErrors[field] = issue.message;
            }
            setErrors(fieldErrors);
            return;
        }

        // Balance cap — contextual check not expressible as a pure field rule
        const balance = parseFloat(form.balance) || 0;
        if (totalAmount > balance) {
            setErrors({
                balance_cap: `Total amount (₱ ${fmtCurrency(totalAmount)}) exceeds the account balance of ₱ ${fmtCurrency(balance)}.`,
            });
            return;
        }

        setIsSaving(true);
        try {
            const res = await financeSvc.post('/abms/budget-request-entry/items', {
                budget_request_entry_id: rsHeaderId,
                account_id: form.accountId,
                account_code: form.accountNo,
                account_parent_id: parseInt(form.accountParentId, 10),
                description: form.itemDescription,
                unit_cost: parseFloat(form.unitCost),
                quantity: parseInt(form.quantity, 10),
                unit_of_measurement: form.unitOfMeasurement,
                total_cost: totalAmount,
                office_supply_id: rsType === 'stockroom' ? form.officeSupplyId : null,
            });

            const saved = res.data.item;
            const newItem: RSFormItem = {
                id: saved.id,
                accountNo: saved.account_code,
                itemDescription: saved.description,
                unitCost: String(saved.unit_cost),
                quantity: String(saved.quantity),
                unitOfMeasurement: saved.unit_of_measurement ?? form.unitOfMeasurement,
                totalCost: parseFloat(saved.total_cost),
            };
            onSave(newItem);
            onClose();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setErrors({
                balance_cap: axiosErr?.response?.data?.message ?? 'Failed to save item. Please try again.',
            });
        } finally {
            setIsSaving(false);
        }
    }

    // ── Shared field components ──────────────────────────────────────────────
    const displayOnlyField = (label: string, value: string, mono = false, color?: string) => (
        <div>
            <span style={{ display: 'block', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: t.tableHeadText, marginBottom: 4 }}>
                {label}
            </span>
            <div style={{
                padding: '7px 12px', borderRadius: 8,
                background: isDark ? 'rgba(10,22,50,0.55)' : 'rgba(220,234,255,0.55)',
                border: `1px solid ${t.sectionDivider}`,
                fontSize: 11, fontWeight: 600,
                color: color ?? t.cellText,
                minHeight: 34,
                fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit',
                fontVariantNumeric: mono ? 'tabular-nums' : 'normal',
            }}>
                {value || <span style={{ color: t.cellMuted, fontStyle: 'italic', fontWeight: 400 }}>—</span>}
            </div>
        </div>
    );

    const inputField = (
        label: string,
        value: string,
        onChange: (v: string) => void,
        opts?: { type?: string; placeholder?: string; mono?: boolean; readOnly?: boolean; disabled?: boolean; error?: string },
    ) => {
        const hasError = !!opts?.error;
        const isDisabled = !!opts?.disabled;
        return (
            <div>
                <span style={{ display: 'block', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: hasError ? t.cellRed : t.tableHeadText, marginBottom: 4 }}>
                    {label}
                </span>
                <input
                    type={opts?.type ?? 'text'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    readOnly={opts?.readOnly || isDisabled}
                    placeholder={isDisabled ? '' : (opts?.placeholder ?? '')}
                    style={{
                        width: '100%', padding: '7px 12px',
                        borderRadius: 8,
                        background: (opts?.readOnly || isDisabled)
                            ? (isDark ? 'rgba(10,22,50,0.40)' : 'rgba(220,234,255,0.45)')
                            : t.inputBg,
                        border: `1px solid ${hasError ? t.cellRed : t.inputBorder}`,
                        fontSize: 11, fontWeight: 600, color: isDisabled ? t.cellMuted : t.inputText,
                        outline: 'none', transition: 'border-color .15s ease',
                        fontFamily: opts?.mono ? "'JetBrains Mono', monospace" : 'inherit',
                        fontVariantNumeric: opts?.mono ? 'tabular-nums' : 'normal',
                        cursor: (opts?.readOnly || isDisabled) ? 'default' : 'text',
                        opacity: isDisabled ? 0.5 : 1,
                    }}
                    onFocus={e => { if (!opts?.readOnly && !isDisabled) (e.target as HTMLElement).style.borderColor = isDark ? 'rgba(99,155,255,0.70)' : 'rgba(37,99,235,0.60)'; }}
                    onBlur={e => { (e.target as HTMLElement).style.borderColor = hasError ? t.cellRed : t.inputBorder; }}
                />
                {hasError && (
                    <span style={{ display: 'block', fontSize: 9, color: t.cellRed, marginTop: 3, fontWeight: 600 }}>
                        {opts!.error}
                    </span>
                )}
            </div>
        );
    };

    const sectionLabel = (text: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 10px' }}>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.10em', color: t.tableHeadText }}>
                {text}
            </span>
            <div style={{ flex: 1, height: 1, background: t.sectionDivider }} />
        </div>
    );

    // Supply picker — rendered at z-index above everything, shown instead of AddItem
    const supplyPicker = (
        <SelectSupplyModal
            open={showSupplyPicker}
            onClose={handleSupplyClose}
            onSelect={handleSupplySelect}
            t={t}
            isDark={isDark}
        />
    );

    // Account picker — rendered above AddItem
    const accountPicker = (
        <SelectAccountModal
            open={showAccountPicker}
            onClose={() => setShowAccountPicker(false)}
            onSelect={handleAccountSelect}
            t={t}
            isDark={isDark}
            departmentId={departmentId}
            sectionId={sectionId}
            currentSchoolYear={currentSchoolYear}
        />
    );

    // Hide the AddItem modal while supply picker is open (one modal at a time)
    if (!open) return <>{supplyPicker}{accountPicker}</>;

    const portal = createPortal(
        <>
            {/* AddItem backdrop — hidden when supply picker is open */}
            {!showSupplyPicker && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 100000,
                        background: isDark ? 'rgba(0,0,0,0.72)' : 'rgba(0,20,60,0.45)',
                        backdropFilter: 'blur(6px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '24px 16px',
                        overflowY: 'auto',
                    }}
                    onClick={e => { if (e.target === e.currentTarget) onClose(); }}
                >
                    <style>{`
                        @keyframes additem-in {
                            from { opacity: 0; transform: scale(0.96) translateY(12px); }
                            to   { opacity: 1; transform: scale(1) translateY(0); }
                        }
                    `}</style>

                    <div
                        style={{
                            width: '100%', maxWidth: '500px',
                            background: t.cardBg,
                            border: `1px solid ${t.cardBorder}`,
                            borderRadius: 18,
                            boxShadow: t.cardShadow,
                            overflow: 'hidden',
                            animation: 'additem-in .20s cubic-bezier(.22,1,.36,1)',
                            display: 'flex', flexDirection: 'column',
                        }}
                    >
                        {/* ── Header ── */}
                        <div style={{ background: t.cardHeaderBg, borderBottom: `1px solid ${t.cardHeaderBorder}`, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-.01em', color: t.titleColor, margin: 0 }}>
                                    Add New Item
                                </h2>
                                <p style={{ fontSize: 10, color: t.cellMuted, margin: '2px 0 0' }}>
                                    Fill in the item details to add to the requisition slip.
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.cellMuted, cursor: 'pointer', transition: 'all .12s ease', flexShrink: 0 }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.08)';
                                    (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'rgba(248,113,113,0.40)' : 'rgba(220,38,38,0.30)';
                                    (e.currentTarget as HTMLElement).style.color = t.cellRed;
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                                    (e.currentTarget as HTMLElement).style.borderColor = t.cardBorder;
                                    (e.currentTarget as HTMLElement).style.color = t.cellMuted;
                                }}
                            >
                                <X style={{ width: 14, height: 14 }} />
                            </button>
                        </div>

                        {/* ── Body ── */}
                        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>

                            {/* Account section */}
                            {sectionLabel('Account Information')}

                            {/* Get Account button */}
                            <button
                                onClick={handleOpenAccountPicker}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '7px 14px', borderRadius: 8,
                                    background: t.btnRefresh.bg, border: `1px solid ${errors.accountNo ? t.cellRed : t.btnRefresh.border}`,
                                    color: t.btnRefresh.text, fontSize: 11, fontWeight: 700,
                                    cursor: 'pointer', alignSelf: 'flex-start', transition: 'background .12s ease',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = t.btnRefresh.hover; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = t.btnRefresh.bg; }}
                            >
                                <Search style={{ width: 13, height: 13 }} />
                                Get Account
                            </button>
                            {errors.accountNo && (
                                <span style={{ fontSize: 9, color: t.cellRed, fontWeight: 600, marginTop: -8 }}>
                                    {errors.accountNo}
                                </span>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {displayOnlyField('Account No.', form.accountNo, true, t.cellBlue)}
                                {displayOnlyField('Account Name', form.accountName)}
                            </div>
                            {displayOnlyField(
                                'Balance',
                                form.balance ? `₱ ${fmtCurrency(parseFloat(form.balance))}` : '',
                                true,
                                t.cellGreen,
                            )}

                            {/* Item section — locked until account is selected */}
                            {sectionLabel('Item Details')}

                            {rsType === 'stockroom' && accountSelected && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 7,
                                    padding: '8px 12px', borderRadius: 8,
                                    background: isDark ? 'rgba(59,130,246,0.10)' : 'rgba(219,234,254,0.65)',
                                    border: `1px solid ${isDark ? 'rgba(99,155,255,0.30)' : 'rgba(37,99,235,0.28)'}`,
                                    fontSize: 10, color: t.cellBlue, fontWeight: 600,
                                }}>
                                    <ClipboardList style={{ width: 13, height: 13, flexShrink: 0 }} />
                                    Select an item using Get Items. Stockroom item details cannot be entered manually.
                                </div>
                            )}

                            {!accountSelected && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 7,
                                    padding: '8px 12px', borderRadius: 8,
                                    background: isDark ? 'rgba(251,191,36,0.08)' : 'rgba(253,230,138,0.35)',
                                    border: `1px solid ${isDark ? 'rgba(251,191,36,0.28)' : 'rgba(202,138,4,0.35)'}`,
                                    fontSize: 10, color: isDark ? '#fbbf24' : '#92400e', fontWeight: 600,
                                }}>
                                    <AlertCircle style={{ width: 13, height: 13, flexShrink: 0 }} />
                                    Select an account above before filling in the item details.
                                </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                                <div style={{ flex: 1 }}>
                                    {inputField('Item Description', form.itemDescription, v => set('itemDescription', v), {
                                        placeholder: accountSelected ? 'e.g. Ballpen, black, 12pcs/box…' : '',
                                        readOnly: rsType === 'stockroom' || itemFromSupply,
                                        disabled: !accountSelected,
                                        error: errors.itemDescription,
                                    })}
                                </div>
                                {rsType === 'stockroom' && (
                                    <button
                                        onClick={accountSelected ? handleOpenSupplyPicker : undefined}
                                        disabled={!accountSelected}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 5,
                                            padding: '7px 12px', borderRadius: 8, flexShrink: 0,
                                            background: !accountSelected ? t.btnDisBg : t.btnPrevSY.bg,
                                            border: `1px solid ${!accountSelected ? t.btnDisBorder : t.btnPrevSY.border}`,
                                            color: !accountSelected ? t.btnDisText : t.btnPrevSY.text,
                                            fontSize: 11, fontWeight: 700,
                                            cursor: !accountSelected ? 'not-allowed' : 'pointer',
                                            transition: 'background .12s ease',
                                            whiteSpace: 'nowrap',
                                            opacity: !accountSelected ? 0.55 : 1,
                                        }}
                                        onMouseEnter={e => { if (accountSelected) (e.currentTarget as HTMLElement).style.background = t.btnPrevSY.hover; }}
                                        onMouseLeave={e => { if (accountSelected) (e.currentTarget as HTMLElement).style.background = t.btnPrevSY.bg; }}
                                    >
                                        <ClipboardList style={{ width: 13, height: 13 }} />
                                        Get Items
                                    </button>
                                )}
                            </div>

                            {/* Pricing section */}
                            {sectionLabel('Pricing & Quantity')}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                {inputField('Unit Cost', form.unitCost, v => set('unitCost', v), {
                                    type: 'number', placeholder: accountSelected ? '0.00' : '',
                                    mono: true, readOnly: rsType === 'stockroom' || itemFromSupply,
                                    disabled: !accountSelected,
                                    error: errors.unitCost,
                                })}
                                {inputField('Quantity', form.quantity, v => set('quantity', v), {
                                    type: 'number', placeholder: accountSelected ? '0' : '',
                                    mono: true,
                                    disabled: !accountSelected,
                                    error: errors.quantity,
                                })}
                                {inputField('Unit of Measurement', form.unitOfMeasurement, v => set('unitOfMeasurement', v), {
                                    placeholder: accountSelected ? 'pcs, box, ream…' : '',
                                    readOnly: rsType === 'stockroom' || itemFromSupply,
                                    disabled: !accountSelected,
                                    error: errors.unitOfMeasurement,
                                })}
                            </div>

                            {/* Balance cap error */}
                            {errors.balance_cap && (
                                <div style={{
                                    display: 'flex', alignItems: 'flex-start', gap: 7,
                                    padding: '8px 12px', borderRadius: 8,
                                    background: isDark ? 'rgba(248,113,113,0.10)' : 'rgba(254,226,226,0.55)',
                                    border: `1px solid ${isDark ? 'rgba(248,113,113,0.38)' : 'rgba(220,38,38,0.30)'}`,
                                    fontSize: 10, color: t.cellRed, fontWeight: 600,
                                }}>
                                    <AlertCircle style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} />
                                    {errors.balance_cap}
                                </div>
                            )}

                            {/* Total Amount — display only */}
                            {(() => {
                                const balance = parseFloat(form.balance) || 0;
                                const overBudget = accountSelected && totalAmount > 0 && totalAmount > balance;
                                return (
                                    <div
                                        style={{
                                            padding: '10px 16px', borderRadius: 10,
                                            background: overBudget
                                                ? (isDark ? 'rgba(248,113,113,0.08)' : 'rgba(254,226,226,0.55)')
                                                : (isDark ? 'rgba(10,22,50,0.80)' : 'rgba(210,228,255,0.70)'),
                                            border: `1px solid ${overBudget
                                                ? (isDark ? 'rgba(248,113,113,0.38)' : 'rgba(220,38,38,0.30)')
                                                : (isDark ? 'rgba(74,222,128,0.22)' : 'rgba(4,120,87,0.20)')}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        }}
                                    >
                                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: overBudget ? t.cellRed : t.totalLabel }}>
                                            Total Amount{overBudget ? ' — Exceeds Balance' : ''}
                                        </span>
                                        <span style={{ fontSize: 14, fontWeight: 800, color: overBudget ? t.cellRed : t.cellGreen, fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' }}>
                                            ₱ {fmtCurrency(totalAmount)}
                                        </span>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* ── Footer actions ── */}
                        <div style={{ padding: '12px 20px', background: t.cardHeaderBg, borderTop: `1px solid ${t.cardHeaderBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                            <button
                                onClick={onClose}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    padding: '7px 16px', borderRadius: 8,
                                    background: isDark ? 'rgba(248,113,113,0.10)' : 'rgba(254,226,226,0.60)',
                                    border: `1px solid ${isDark ? 'rgba(248,113,113,0.35)' : 'rgba(220,38,38,0.28)'}`,
                                    color: isDark ? t.cellRed : '#b91c1c',
                                    fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'background .12s ease',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(248,113,113,0.20)' : 'rgba(254,226,226,0.90)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(248,113,113,0.10)' : 'rgba(254,226,226,0.60)'; }}
                            >
                                <X style={{ width: 13, height: 13 }} />
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    padding: '7px 18px', borderRadius: 8,
                                    background: isSaving ? t.btnDisBg : t.btnNew.bg,
                                    border: `1px solid ${isSaving ? t.btnDisBorder : t.btnNew.border}`,
                                    color: isSaving ? t.btnDisText : t.btnNew.text,
                                    fontSize: 11, fontWeight: 700,
                                    cursor: isSaving ? 'not-allowed' : 'pointer',
                                    opacity: isSaving ? 0.6 : 1,
                                    transition: 'background .12s ease',
                                }}
                                onMouseEnter={e => { if (!isSaving) (e.currentTarget as HTMLElement).style.background = t.btnNew.hover; }}
                                onMouseLeave={e => { if (!isSaving) (e.currentTarget as HTMLElement).style.background = t.btnNew.bg; }}
                            >
                                {isSaving
                                    ? <RefreshCw style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />
                                    : <Save style={{ width: 13, height: 13 }} />
                                }
                                {isSaving ? 'Saving…' : 'Save Item'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Supply picker — overlays on top when active */}
            {supplyPicker}

            {/* Account picker — overlays on top when active */}
            {accountPicker}
        </>,
        document.body,
    );

    return <>{portal}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// RSFormModal — shown after Confirm & Proceed from NewRSModal
