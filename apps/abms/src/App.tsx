import { Outlet } from '@tanstack/react-router';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <div>
      <ThemeProvider>
        <Outlet />
      </ThemeProvider>
    </div>
  );
}