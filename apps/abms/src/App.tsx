import { Outlet } from '@tanstack/react-router';
import { ThemeProvider } from './context/ThemeContext';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export default function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[var(--abms-canvas)] text-[var(--abms-text)]">
        <Outlet />
        {import.meta.env.DEV && (
          <TanStackRouterDevtools position="bottom-left" />
        )}
      </div>
    </ThemeProvider>
  );
}

