import { RootRoute, Route, createRouter, Outlet, redirect, isRedirect } from '@tanstack/react-router';
import App from './App';
import Home from './pages/Home';
import Test from './pages/Test';
import { financeSvc } from '@repo/axios-config/finance-service';
import MaintenanceScreen from './pages/MaintenanceScreen';
import BudgetSettings from './pages/administration/BudgetSettings.tsx';
import OfficeSupplies from './pages/administration/OfficeSupplies.tsx';
import MainAccount from './pages/administration/MainAccount.tsx';
import SubAccounts from './pages/administration/SubAccounts.tsx';
import BudgetStatus from './pages/administration/BudgetStatus.tsx';
import Department from './pages/administration/Department.tsx';
import UserAccess from './pages/administration/UserAccess.tsx';
import { authSvc } from '@repo/axios-config/auth-service';
import BudgetProposalEntry from './pages/transactions/budgetproposalentry';
import BudgetReview from './pages/administration/BudgetReview.tsx';
import BudgetReviewDetails from './pages/administration/BudgetReviewDetails.tsx';
import BudgetTransferAccount from './pages/administration/BudgetTransferAccount.tsx';
import BudgetAdjustmentEntry from './pages/administration/BudgetAdjustmentEntry.tsx';
import BudgetRequestEntry from './pages/transactions/budgetrequestentry';
import RequisitionProcess from './pages/transactions/requisition-process/index.tsx';
import BudgetPerformanceDepartment from './pages/reports/BudgetPerformanceDepartment.tsx';
import BudgetPerformanceAccount from './pages/reports/BudgetPerformanceAccount.tsx';
import BudgetPerformanceUniversity from './pages/reports/BudgetPerformanceUniversity.tsx';
import ItemRequestedPerAccount from './pages/reports/ItemRequestedPerAccount.tsx';
import ItemsRequestedByPayee from './pages/reports/ItemsRequestedByPayee.tsx';
import AdjustmentsPerDepartment from './pages/reports/AdjustmentsPerDepartment.tsx';
import BudgetLiquidation from './pages/reports/BudgetLiquidation.tsx';
import BudgetProposalReports from './pages/reports/BudgetProposalReports.tsx';
import LiquidationSubmission from './pages/transactions/liquidationsubmission';
import UnauthorizedScreen from './components/UnauthorizedScreen.tsx';

const rootRoute = new RootRoute({
    component: App,
});

const resolveLoginUrl = () => {
    const productionBaseUrl = import.meta.env.VITE_ADU_LIVE_PRODUCTION_URL?.trim()
        || 'https://live.adamson.edu.ph';
    const baseUrl = (import.meta.env.PROD
        ? productionBaseUrl
        : 'http://localhost.test:8081').replace(/\/+$/, '');

    return `${baseUrl}/login`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Permission helpers — mirrors the logic in Sidebar.tsx (canShowItem/buildPermissionSet)
// so that route access matches what's shown in the nav.
// ─────────────────────────────────────────────────────────────────────────────

type AbmsPermission = {
    permission_id?: string | number;
    auth_permission?: {
        id?: string | number;
        name?: string;
    } | null;
};

type AbmsPermissionsPayload = {
    general_permissions?: AbmsPermission[];
    abms_permissions?: AbmsPermission[];
};

const getPermissionName = (permission: AbmsPermission) => permission.auth_permission?.name;

const buildPermissionSet = (payload?: AbmsPermissionsPayload | null) => {
    const permissionNames = new Set<string>();

    payload?.general_permissions?.forEach(permission => {
        const name = getPermissionName(permission);
        if (name) permissionNames.add(name);
    });

    payload?.abms_permissions?.forEach(permission => {
        const name = getPermissionName(permission);
        if (name) permissionNames.add(name);
    });

    return permissionNames;
};

/**
 * Guard to be used inside a route's beforeLoad. Pass the list of permission
 * names allowed to access the route (same array you'd pass to the Sidebar
 * nav item's `permissions` prop). If the list is empty/undefined, access is
 * allowed to any authenticated user (matches Sidebar's canShowItem default).
 */
const requirePermissions = (context: any, permissions?: string[]) => {
    if (!permissions || permissions.length === 0) return;

    const userPermissions = buildPermissionSet(context?.user?.abmsPermissions);
    (context?.user?.permissions ?? []).forEach((permission: string) => {
        userPermissions.add(permission);
    });
    const allowed = permissions.some(permission => userPermissions.has(permission));

    if (!allowed) {
        throw redirect({ to: '/unauthorized' });
    }
};


const protectedRoute = new Route({
    getParentRoute: () => rootRoute,
    id: 'protected',
    beforeLoad: async () => {
        try {
            await financeSvc.get('/abms/protected-test');
        } catch (error: any) {
            if (error.response?.status === 401) {
                window.location.assign(resolveLoginUrl());
                await new Promise(() => { });
            }
            if (error.response?.status === 503) {
                window.location.href = '/maintenance';
                await new Promise(() => { });
            }
        }

        // Fetch user once here, pass it down as context
        try {
            const authRes = await authSvc.get('/user');
            const permissions: string[] = authRes.data.permissions ?? [];

            if (!permissions.includes('abms_access')) {
                window.location.href = '/403';
                await new Promise(() => { });
            }

            const username = authRes.data.username;
            const nameRes = await financeSvc.get(`/user/${username}`);

            const abmsPermissionsRes = await financeSvc.get('/user/abmspermissions');

            return {
                user: {
                    username,
                    permissions,
                    abmsPermissions: abmsPermissionsRes.data,
                    ...nameRes.data,
                },
            };
        } catch {
            return { user: null };
        }
    },
    component: () => <Outlet />,
});

export const homeRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/',
    loader: async () => {
        const response = await financeSvc.get('/abms/test');
        return { data: response.data };
    },
    component: Home,
});

export const budgetsettingsRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/admin/budget-settings',
    beforeLoad: ({ context }) => requirePermissions(context, ['admin-access', 'budget-access', 'controller-access']),
    loader: async () => {
        const response = await financeSvc.get('/abms/budget-settings');
        return { data: response.data };
    },
    component: BudgetSettings,
});
export const budgetstatusRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/admin/budget-status',
    beforeLoad: ({ context }) => requirePermissions(context, ['no-access']),
    loader: async () => {
        const response = await financeSvc.get('/abms/budget-status');
        return { data: response.data };
    },
    component: BudgetStatus,
});

export const departmentRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/admin/department',
    beforeLoad: ({ context }) => requirePermissions(context, ['admin-access', 'budget-access', 'controller-access']),
    loader: async () => {
        const response = await financeSvc.get('/abms/department');
        return { data: response.data };
    },
    component: Department,
});

export const budgetreviewRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/admin/budget-review',
    beforeLoad: ({ context }) => requirePermissions(context, ['admin-access', 'budget-access', 'controller-access']),
    loader: async () => {
        const response = await financeSvc.get('/abms/budget-review');
        const {
            proposal_school_year,
            current_school_year,
            departments,
            sections,
            mainaccounts,
        } = response.data;

        return {
            proposal_school_year,
            current_school_year,
            departments,
            sections,
            mainaccounts,
        };
    },
    component: BudgetReview,
});

export const budgetreviewdetailsRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/admin/budget-review/details',
    beforeLoad: ({ context }) => requirePermissions(context, ['admin-access', 'budget-access', 'controller-access']),
    // Navigation state (mainAccountId, mainAccountName, unitId, unitName, unitKind,
    // current_school_year, proposal_school_year) is passed via router navigate({ state })
    // from BudgetReview.tsx and read inside BudgetReviewDetails via useRouter().state.location.state
    component: BudgetReviewDetails,
});

export const userdepartmentRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/admin/user-department-access',
    beforeLoad: ({ context }) => requirePermissions(context, ['abms_user_department_access', 'controller-access']),
    loader: async () => {
        const [permissionsRes, departmentsRes, usersRes] = await Promise.all([
            authSvc.get('/abms-permissions'),
            financeSvc.get('/abms/department'),
            financeSvc.get('/abms/access'),
        ]);

        return {
            data: permissionsRes.data,
            departments: departmentsRes.data,
            users: usersRes.data,
        };
    },
    component: UserAccess,
});

export const budgettransferaccountRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/admin/budget-transfer-account',
    beforeLoad: ({ context }) => requirePermissions(context, ['admin-access', 'budget-access', 'controller-access']),
    loader: async () => {
        const response = await financeSvc.get('/abms/budget-transfer-account');
        const { units, school_years } = response.data;
        return { units, school_years };
    },
    component: BudgetTransferAccount,
});

export const budgetadjustmententryRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/admin/budget-adjustment-entry',
    beforeLoad: ({ context }) => requirePermissions(context, ['admin-access', 'budget-access', 'controller-access']),
    loader: async () => {
        const response = await financeSvc.get('/abms/budget-adjustment-entry');
        const { proposal_school_year, current_school_year, departments, sections, main_accounts, sub_accounts, adjustment_entries } = response.data;
        return { proposal_school_year, current_school_year, departments, sections, main_accounts, sub_accounts, adjustment_entries };
    },
    component: BudgetAdjustmentEntry,
});



export const officeSuppliesRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/admin/office-supplies',
    beforeLoad: ({ context }) => requirePermissions(context, ['stockroom-access']),
    loader: async () => {
        const response = await financeSvc.get('/abms/office-supplies');
        return { data: response.data };
    },
    component: OfficeSupplies,
});

export const mainAccountRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/admin/chart-of-accounts',
    beforeLoad: ({ context }) => requirePermissions(context, ['admin-access', 'budget-access', 'controller-access']),
    loader: async () => {
        const response = await financeSvc.get('/abms/main-accounts');
        return { data: response.data };
    },
    component: MainAccount,
});

export const subAccountsRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/admin/sub-accounts/$parentId',
    // Not a direct sidebar nav item; inherits Chart of Accounts' permission requirement.
    beforeLoad: ({ context }) => requirePermissions(context, ['admin-access', 'budget-access', 'controller-access']),
    loader: async ({ params }) => {
        const [subRes, parentRes] = await Promise.all([
            financeSvc.get('/abms/sub-accounts', { params: { parent_id: params.parentId } }),
            financeSvc.get(`/abms/main-accounts/${params.parentId}`),
        ]);
        return { data: subRes.data, parent: parentRes.data };
    },
    component: SubAccounts,
});

export const budgetproposalentryRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/transactions/budget-proposal-entry',
    beforeLoad: ({ context }) => requirePermissions(context, ['allow-budget-proposal-entry']),
    loader: async ({ context }) => {
        const { user } = context;

        // 1. Fetch permissions first
        const permissionsRes = await authSvc.get('/abms-permissions');
        const permissions = permissionsRes.data.permissions;

        // 2. Pass it along to the finance service
        const response = await financeSvc.get('/abms/budget-proposal-entry', {
            params: {
                username: user.username,
                permissions,
            },
        });

        return { data: response.data };
    },
    component: BudgetProposalEntry,
});

export const budgetrequestentryRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/transactions/budget-request-entry',
    beforeLoad: ({ context }) => requirePermissions(context, ['allow-budget-request-entry']),
    loader: async ({ context }) => {
        const username = context.user?.username;
        const budgetrequestpermission = await authSvc.get('/abms-permissions/');
        const permission = budgetrequestpermission.data.permissions.find(
            (p: any) => p.name === 'allow-budget-request-entry'
        );
        const permissionId = permission?.id;
        const admin = budgetrequestpermission.data.permissions.find(
            (p: any) => p.name === 'admin-access'
        );
        const adminPermissionId = admin?.id;

        const budget = budgetrequestpermission.data.permissions.find(
            (p: any) => p.name === 'budget-access'
        );

        const budgetPermissionId = budget?.id;

        const response = await financeSvc.get(
            '/abms/budget-request-entry',
            {
                params: { username, permissionId, adminPermissionId, budgetPermissionId }
            }
        );

        const { departments, sections, current_school_year } = response.data;
        return { departments, sections, current_school_year };
    },
    component: BudgetRequestEntry,
});


export const requesitionprocessRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/transactions/requisition-process',
    beforeLoad: ({ context }) => requirePermissions(context, ['budget-access', 'admin-access', 'accounting-access', 'cashier-access', 'logistics-access', 'stockroom-access', 'controller-access']),
    loader: async () => {
        const permissions = await authSvc.get('/abms-permissions/');
        const response = await financeSvc.get('/abms/requisition-process', {
            params: {
                permissions: permissions.data.permissions,
            },
        });

        const userpermissions: string[] = response.data;

        if (!userpermissions || userpermissions.length === 0) {
            throw redirect({ to: '/unauthorized' });
        }

        return { userpermissions };
    },
    component: RequisitionProcess,
});

export const budgetperformancedepartmentRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/reports/budget-performance-department',
    beforeLoad: ({ context }) => requirePermissions(context, ['admin-access', 'budget-access', 'controller-access']),
    loader: async () => {
        const data = await financeSvc.get('abms/budget-performance-per-department');

        return { data }
    },
    component: BudgetPerformanceDepartment,
});
export const budgetperformanceaccountRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/reports/budget-performance-account',
    beforeLoad: ({ context }) => requirePermissions(context, ['admin-access', 'budget-access', 'controller-access']),
    loader: async () => {
        const data = await financeSvc.get('abms/budget-performance-per-account');

        return { data };
    },
    component: BudgetPerformanceAccount,
});
export const budgetperformanceuniversityRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/reports/budget-performance-university',
    beforeLoad: ({ context }) => requirePermissions(context, ['admin-access', 'budget-access', 'controller-access']),
    loader: async () => {
        const data = await financeSvc.get('abms/budget-performance-university');

        return { data };
    },
    component: BudgetPerformanceUniversity,
});
export const itemrequestedperaccountRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/reports/item-requested-per-account',
    beforeLoad: ({ context }) => requirePermissions(context, ['admin-access', 'budget-access', 'controller-access']),
    loader: async () => {
        const data = await financeSvc.get('abms/item-requested-per-account');

        return { data };
    },
    component: ItemRequestedPerAccount,
});
export const itemsrequestedbypayeeRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/reports/items-requested-by-payee',
    beforeLoad: ({ context }) => requirePermissions(context, ['admin-access', 'budget-access', 'controller-access']),
    loader: async () => {
        const data = await financeSvc.get('abms/items-requested-by-payee');

        return { data };
    },
    component: ItemsRequestedByPayee,
});
export const adjustmentsperdepartmentRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/reports/adjustments-per-department',
    beforeLoad: ({ context }) => requirePermissions(context, ['admin-access', 'budget-access', 'controller-access']),
    loader: async () => {
        const data = await financeSvc.get('abms/adjustments-per-department');

        return { data };
    },
    component: AdjustmentsPerDepartment,
});
export const budgetliquidationRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/reports/budget-liquidation',
    beforeLoad: ({ context }) => requirePermissions(context, ['admin-access', 'budget-access', 'controller-access']),
    loader: async () => {
        const data = await financeSvc.get('abms/budget-liquidation');

        return { data };
    },
    component: BudgetLiquidation,
});
export const budgetproposalreportsRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/reports/budget-proposal-reports',
    beforeLoad: ({ context }) => requirePermissions(context, ['admin-access', 'budget-access', 'controller-access']),
    loader: async () => {
        const data = await financeSvc.get('abms/budget-proposal-reports');

        return { data };
    },
    component: BudgetProposalReports,
});
export const liquidationsubmissionRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/transactions/liquidation-submission',
    beforeLoad: ({ context }) => requirePermissions(context, ['allow-budget-request-entry', 'budget-access', 'admin-access']),
    loader: async () => {
        const liquidationpermission = await authSvc.get('/abms-permissions/');
        const permission = liquidationpermission.data.permissions.find(
            (p: any) => p.name === 'allow-budget-request-entry'
        );
        const permissionid = permission?.id;
        const budget = liquidationpermission.data.permissions.find(
            (p: any) => p.name === 'budget-access'
        );
        const budgetid = budget?.id;
        const admin = liquidationpermission.data.permissions.find(
            (p: any) => p.name === 'admin-access'
        );
        const adminid = admin?.id;


        const data = await financeSvc.get('abms/liquidation-submission', {
            params: {
                permissionid, budgetid, adminid,
            },
        });

        return { data }
    },
    component: LiquidationSubmission,
});
export const testRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/test',
    loader: async () => {
        const response = await financeSvc.get('/abms/protected-test');
        return { data: response.data };
    },
    component: Test,
});

const maintenanceRoute = new Route({
    getParentRoute: () => rootRoute,
    path: '/maintenance',
    component: MaintenanceScreen,
});

const unauthorizedRoute = new Route({
    getParentRoute: () => rootRoute,
    path: '/unauthorized',
    component: UnauthorizedScreen,
});

const routeTree = rootRoute.addChildren([
    protectedRoute.addChildren([homeRoute, testRoute, budgetsettingsRoute, departmentRoute, officeSuppliesRoute, mainAccountRoute, subAccountsRoute, budgetstatusRoute, userdepartmentRoute, budgetproposalentryRoute, budgetreviewRoute, budgetreviewdetailsRoute, budgettransferaccountRoute, budgetadjustmententryRoute, budgetrequestentryRoute, requesitionprocessRoute, budgetperformancedepartmentRoute, budgetperformanceaccountRoute, budgetperformanceuniversityRoute, itemrequestedperaccountRoute, itemsrequestedbypayeeRoute, adjustmentsperdepartmentRoute, budgetliquidationRoute, budgetproposalreportsRoute, liquidationsubmissionRoute]),
    unauthorizedRoute,
    maintenanceRoute,
]);

export const router = createRouter({ routeTree });
