import { createContext, useContext, type ReactNode } from 'react';

/** DRS access codes from registrar `GET .../access` (loader shape). */
export type MaintenanceLoaderAccess = string[];

const MaintenanceLoaderDataContext = createContext<{
  access: MaintenanceLoaderAccess;
} | null>(null);

export function MaintenanceLoaderDataProvider({
  access,
  children,
}: {
  access: MaintenanceLoaderAccess;
  children: ReactNode;
}) {
  return (
    <MaintenanceLoaderDataContext.Provider value={{ access }}>
      {children}
    </MaintenanceLoaderDataContext.Provider>
  );
}

export function useMaintenanceLoaderData(): { access: MaintenanceLoaderAccess } {
  const ctx = useContext(MaintenanceLoaderDataContext);
  if (!ctx) {
    throw new Error(
      'useMaintenanceLoaderData must be used within MaintenanceLoaderDataProvider',
    );
  }
  return ctx;
}
