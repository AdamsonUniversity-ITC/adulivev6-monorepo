import React, { useState } from 'react';
import AdamsonBudgetLayout from '../../../layouts/Screenlayout';
import { useLoaderData } from '@tanstack/react-router';
import { requesitionprocessRoute } from '../../../router';
import { T, Theme } from './shared/tokens';
import { ROLES, PermissionKey } from './shared/constants';
import { RolePickerModal } from './shared/components/RolePickerModal';
import { BudgetView } from './roles/BudgetView';
import { AdminView } from './roles/AdminView';
import { LogisticsView } from './roles/LogisticsView';
import { AccountingView } from './roles/AccountingView';
import { StockroomView } from './roles/StockroomView';
import { CashierView } from './roles/CashierView';

// ─────────────────────────────────────────────────────────────────────────────
// Role view dispatch — maps a PermissionKey to its view component
// ─────────────────────────────────────────────────────────────────────────────
function RoleView({
    roleKey,
    t,
    isDark,
    canSwitch,
    onSwitchRole,
}: {
    roleKey: PermissionKey;
    t: Theme;
    isDark: boolean;
    canSwitch: boolean;
    onSwitchRole: () => void;
}) {
    const props = { t, isDark, canSwitch, onSwitchRole };
    switch (roleKey) {
        case 'budget-access':     return <BudgetView     {...props} />;
        case 'admin-access':      return <AdminView      {...props} />;
        case 'logistics-access':  return <LogisticsView  {...props} />;
        case 'accounting-access': return <AccountingView {...props} />;
        case 'stockroom-access':  return <StockroomView  {...props} />;
        case 'cashier-access':    return <CashierView    {...props} />;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner component
// ─────────────────────────────────────────────────────────────────────────────
function RequisitionProcessInner({ t, isDark }: { t: Theme; isDark: boolean }) {
    const { userpermissions } = useLoaderData({ from: requesitionprocessRoute.id });

    const matched = ROLES.filter(r => userpermissions.includes(r.key));
    const [confirmedRole, setConfirmedRole] = useState<PermissionKey | null>(null);

    const activeRoleKey: PermissionKey | null =
        matched.length === 1 ? matched[0].key : confirmedRole;

    if (matched.length === 0) {
        return (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: t.cellMuted }}>You don't have access to this page.</p>
            </div>
        );
    }

    return (
        <>
            {matched.length > 1 && !confirmedRole && (
                <RolePickerModal
                    matched={matched}
                    onConfirm={setConfirmedRole}
                    t={t}
                    isDark={isDark}
                />
            )}
            {activeRoleKey && (
                <RoleView
                    roleKey={activeRoleKey}
                    t={t}
                    isDark={isDark}
                    canSwitch={matched.length > 1}
                    onSwitchRole={() => setConfirmedRole(null)}
                />
            )}
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root export — router still points here, nothing changes in router.tsx
// ─────────────────────────────────────────────────────────────────────────────
export default function RequisitionProcess() {
    return (
        <AdamsonBudgetLayout>
            {(isDark: boolean) => {
                const t = isDark ? T.dark : T.light;
                return <RequisitionProcessInner t={t} isDark={isDark} />;
            }}
        </AdamsonBudgetLayout>
    );
}