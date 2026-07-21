import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export function DrsThemeProvider({ children }: Props) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="drs-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
