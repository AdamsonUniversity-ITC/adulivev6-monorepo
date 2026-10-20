import React, { useState, useEffect } from 'react';
import AdamsonBudgetLayout from '../../../layouts/Screenlayout';
import { useLoaderData } from '@tanstack/react-router';
import { requesitionprocessRoute } from '../../../router';
import { financeSvc } from '@repo/axios-config';
import { T, Theme } from './shared/tokens';
import { ROLES, PermissionKey } from './shared/constants';
import { DeptOption } from './shared/types';
import { RolePickerModal } from './shared/components/RolePickerModal';
import { BudgetView } from './roles/BudgetView';
import { AdminView } from './roles/AdminView';
import { ApprovalRoleView } from './roles/ApprovalRoleView';
import { LogisticsView } from './roles/LogisticsView';
import { AccountingView } from './roles/AccountingView';
import { StockroomView } from './roles/StockroomView';
import { CashierView } from './roles/CashierView';

// ─────────────────────────────────────────────────────────────────────────────
// Dept/section data — fetched once at the index level and threaded down
// ─────────────────────────────────────────────────────────────────────────────
interface DeptData {
    departments: DeptOption[];
    sections: DeptOption[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Role view dispatch — maps a PermissionKey to its view component
// ─────────────────────────────────────────────────────────────────────────────
function RoleView({
    roleKey,
    t,
    isDark,
    canSwitch,
    onSwitchRole,
    deptData,
}: {
    roleKey: PermissionKey;
    t: Theme;
    isDark: boolean;
    canSwitch: boolean;
    onSwitchRole: () => void;
    deptData: DeptData;
}) {
    const props = { t, isDark, canSwitch, onSwitchRole, departments: deptData.departments, sections: deptData.sections };
    switch (roleKey) {
        case 'budget-access': return <BudgetView     {...props} />;
        case 'admin-access': return <AdminView      {...props} />;
        case 'controller-access':
        case 'vpf-access': return <ApprovalRoleView key={roleKey} {...props} roleKey={roleKey} />;
        case 'logistics-access': return <LogisticsView  {...props} />;
        case 'accounting-access': return <AccountingView {...props} />;
        case 'stockroom-access': return <StockroomView  {...props} />;
        case 'cashier-access': return <CashierView    {...props} />;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner component
// ─────────────────────────────────────────────────────────────────────────────
function RequisitionProcessInner({ t, isDark }: { t: Theme; isDark: boolean }) {
    const { userpermissions } = useLoaderData({ from: requesitionprocessRoute.id });

    const [vpfEnabled, setVpfEnabled] = useState(false);
    const matched = ROLES.filter(r => userpermissions.includes(r.key) && (r.key !== 'vpf-access' || vpfEnabled));
    const [confirmedRole, setConfirmedRole] = useState<PermissionKey | null>(null);

    const [deptData, setDeptData] = useState<DeptData>({ departments: [], sections: [] });
    const [deptLoading, setDeptLoading] = useState(true);

    // Fetch departments and sections once on mount
    useEffect(() => {
        financeSvc.get('/abms/requisition-process/departments')
            .then(res => {
                setVpfEnabled(res.data?.meta?.vpf_approval_enabled === true || res.data?.vpf_approval_enabled === true);
                setDeptData({
                    departments: res.data?.departments ?? [],
                    sections: res.data?.sections ?? [],
                });
            })
            .catch(err => {
                console.error('Failed to load departments/sections:', err);
            })
            .finally(() => {
                setDeptLoading(false);
            });
    }, []);

    const activeRoleKey: PermissionKey | null =
        matched.length === 1 ? matched[0].key : confirmedRole;

    if (deptLoading) {
        return (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: t.cellMuted }}>Loading…</p>
            </div>
        );
    }

    if (matched.length === 0) {
        return (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: t.cellMuted }}>
                    {userpermissions.includes('vpf-access') && !vpfEnabled
                        ? 'VPF approval is not enabled.'
                        : "You don't have access to this page."}
                </p>
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
                    deptData={deptData}
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
                return <div className="mx-auto w-full max-w-[1600px]"><RequisitionProcessInner t={t} isDark={isDark} /></div>;
            }}
        </AdamsonBudgetLayout>
    );
} 
