import { RootRoute, Route, createRouter, Outlet, redirect } from '@tanstack/react-router';
import App from './App';
import Home from './pages/Home';
import Test from './pages/Test';
import { financeSvc } from '@repo/axios-config/finance-service';
import MaintenanceScreen from './pages/MaintenanceScreen';
import BudgetSettings from './pages/administration/BudgetSettings.tsx';
import Sections from './pages/administration/Sections.tsx';
import OfficeSupplies from './pages/administration/OfficeSupplies.tsx';
import MainAccount from './pages/administration/MainAccount.tsx';
import SubAccounts from './pages/administration/SubAccounts.tsx';
import BudgetStatus from './pages/administration/BudgetStatus.tsx';


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

export const sectionsRoute = new Route({
    getParentRoute: () => protectedRoute,
    path: '/admin/sections',
    // loader: async () => {
    //     const response = await financeSvc.get('/abms/sections');
    //     return { data: response.data };  
    // },
    component: Sections,
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
    protectedRoute.addChildren([homeRoute, testRoute, budgetsettingsRoute, sectionsRoute, officeSuppliesRoute, mainAccountRoute, subAccountsRoute, budgetstatusRoute]),
    unauthorizedRoute,
    maintenanceRoute,
]);

export const router = createRouter({ routeTree });