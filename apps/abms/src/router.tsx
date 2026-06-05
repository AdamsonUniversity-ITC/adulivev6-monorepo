import { RootRoute, Route, createRouter, Outlet, redirect } from '@tanstack/react-router';
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
import BudgetProposalEntry from './pages/transactions/BudgetProposalEntry.tsx';
import BudgetReview from './pages/administration/BudgetReview.tsx';
import BudgetReviewDetails from './pages/administration/BudgetReviewDetails.tsx';
import BudgetTransferAccount from './pages/administration/BudgetTransferAccount.tsx';
import BudgetAdjustmentEntry from './pages/administration/BudgetAdjustmentEntry.tsx';
import BudgetRequestEntry from './pages/transactions/BudgetRequestEntry.tsx';


const rootRoute = new RootRoute({
    component: App,
});

const protectedRoute = new Route({
    getParentRoute: () => rootRoute,
    id: 'protected',
    beforeLoad: async () => {
        try {
            await financeSvc.get('/abms/protected-test');
        } catch (error: any) {
            if (error.response?.status === 401) {
                window.location.href = 'http://localhost.test:8081/login';
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
            const username = authRes.data.username;
            const nameRes = await financeSvc.get(`/user/${username}`);
            return { user: { username, ...nameRes.data } };
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
    loader: async () => {
        const response = await financeSvc.get('/abms/budget-settings');
        return { data: response.data };
    },
    component: BudgetSettings,
});
export const budgetstatusRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/admin/budget-status',
    loader: async () => {
        const response = await financeSvc.get('/abms/budget-status');
        return { data: response.data };
    },
    component: BudgetStatus,
});

export const departmentRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/admin/department',
    loader: async () => {
        const response = await financeSvc.get('/abms/department');
        return { data: response.data };
    },
    component: Department,
});

export const budgetreviewRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/admin/budget-review',
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
    // Navigation state (mainAccountId, mainAccountName, unitId, unitName, unitKind,
    // current_school_year, proposal_school_year) is passed via router navigate({ state })
    // from BudgetReview.tsx and read inside BudgetReviewDetails via useRouter().state.location.state
    component: BudgetReviewDetails,
});

export const userdepartmentRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/admin/user-department-access',
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
    loader: async () => {
        const response = await financeSvc.get('/abms/office-supplies');
        return { data: response.data };
    },
    component: OfficeSupplies,
});

export const mainAccountRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/admin/chart-of-accounts',
    loader: async () => {
        const response = await financeSvc.get('/abms/main-accounts');
        return { data: response.data };
    },
    component: MainAccount,
});

export const subAccountsRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/admin/sub-accounts/$parentId',
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
    component: () => <div>Unauthorized Page</div>,
});

const routeTree = rootRoute.addChildren([
    protectedRoute.addChildren([homeRoute, testRoute, budgetsettingsRoute, departmentRoute, officeSuppliesRoute, mainAccountRoute, subAccountsRoute, budgetstatusRoute, userdepartmentRoute, budgetproposalentryRoute, budgetreviewRoute, budgetreviewdetailsRoute, budgettransferaccountRoute, budgetadjustmententryRoute, budgetrequestentryRoute]),
    unauthorizedRoute,
    maintenanceRoute,
]);

export const router = createRouter({ routeTree });