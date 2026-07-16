import { createContext, useContext } from 'react';

type MaintenanceNavigationContextValue = {
  openUserManagement: () => void;
};

const MaintenanceNavigationContext =
  createContext<MaintenanceNavigationContextValue | null>(null);

export const MaintenanceNavigationProvider =
  MaintenanceNavigationContext.Provider;

export const useMaintenanceNavigation =
  (): MaintenanceNavigationContextValue => {
    const context = useContext(MaintenanceNavigationContext);

    if (!context) {
      return {
        openUserManagement: () => undefined,
      };
    }

    return context;
  };
