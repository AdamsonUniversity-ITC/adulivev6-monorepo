import { Outlet } from '@tanstack/react-router';
import { ThemeProvider } from './context/ThemeContext';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export default function App() {
  return (
    <div>
      <ThemeProvider>
        <Outlet />
        {import.meta.env.DEV && (
          <TanStackRouterDevtools position="bottom-left" />
        )}
      </ThemeProvider>
    </div>
  );
}