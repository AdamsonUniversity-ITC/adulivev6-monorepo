import { createContext } from 'react';

export interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  toggleTheme: () => undefined,
});
