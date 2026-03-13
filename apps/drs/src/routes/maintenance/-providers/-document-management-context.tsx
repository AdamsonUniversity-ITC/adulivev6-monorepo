import { createContext, JSX, useState } from 'react';

export const DocumentManagementContext = createContext('');

export const DocumentMangementProvider = ({
  children,
}: {
  children: JSX.Element;
}) => {
  const [selectedGroup, setSelectedGroup] = useState(null);

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
