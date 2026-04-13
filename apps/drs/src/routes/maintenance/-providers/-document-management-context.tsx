import { createContext, JSX, useState } from 'react';

type DocumentManagementContextType = {
  selectedGroup: string | null;
  setSelectedGroup: React.Dispatch<React.SetStateAction<string | null>>;
  selectedDocument: string | null;
  setSelectedDocument: React.Dispatch<React.SetStateAction<string | null>>;
  selectedPackage: string | null;
  setSelectedPackage: React.Dispatch<React.SetStateAction<string | null>>;
};

export const DocumentManagementContext =
  createContext<DocumentManagementContextType | null>(null);

export const DocumentMangementProvider = ({
  children,
}: {
  children: JSX.Element;
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  return (
    <DocumentManagementContext.Provider
      value={{
        selectedGroup,
        setSelectedGroup,
        selectedDocument,
        setSelectedDocument,
        selectedPackage,
        setSelectedPackage,
      }}
    >
      {children}
    </DocumentManagementContext.Provider>
  );
};
