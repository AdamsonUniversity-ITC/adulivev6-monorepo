import { RootRoute, Route, createRouter, Outlet, redirect } from '@tanstack/react-router';
import App from './App';
import Home from './pages/Home';
import Test from './pages/Test';
import { financeSvc } from '@repo/axios-config/finance-service';
import MaintenanceScreen from './pages/MaintenanceScreen'; 

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
                 await new Promise(() => {});
            }
            if (error.response?.status === 503) { 
                window.location.href = '/maintenance';
                await new Promise(() => {});
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
    protectedRoute.addChildren([homeRoute, testRoute]),
    unauthorizedRoute,
    maintenanceRoute,
]);

export const router = createRouter({ routeTree });