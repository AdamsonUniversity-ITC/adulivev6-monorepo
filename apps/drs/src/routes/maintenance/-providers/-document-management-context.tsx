import { createContext, JSX, useState } from 'react';

type DocumentManagementContextType = {
  selectedGroup: string | null;
  setSelectedGroup: (next: string | null) => void;
};

export const DocumentManagementContext =
  createContext<DocumentManagementContextType | null>(null);

export const DocumentMangementProvider = ({
  children,
}: {
  children: JSX.Element;
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  return (
    <DocumentManagementContext.Provider
      value={{
        selectedGroup,
        setSelectedGroup,
      }}
    >
      {children}
    </DocumentManagementContext.Provider>
  );
};
