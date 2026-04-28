import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs';
import { JSX, useContext } from 'react';
import { CatalogPane } from './-components/-catalog-pane.tsx';
import { GroupSelector } from './-components/-group-selector.tsx';
import {
  DocumentManagementContext,
  DocumentMangementProvider,
} from './-providers/-document-management-context.tsx';

const ApplicationSheetBody = (): JSX.Element => {
  const ctx = useContext(DocumentManagementContext);
  if (!ctx) {
    throw new Error('ApplicationSheet must be wrapped in DocumentMangementProvider.');
  }

  const { selectedGroup } = ctx;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-foreground text-lg font-semibold">
          Application catalog
        </h2>
        <p className="text-muted-foreground text-sm">
          Manage the documents and packages students can request, grouped by category.
        </p>
      </div>

      <GroupSelector />

      <Tabs defaultValue="documents">
        <TabsList variant="line">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
        </TabsList>
        <TabsContent value="documents" className="mt-4">
          <CatalogPane kind="document" selectedGroup={selectedGroup} />
        </TabsContent>
        <TabsContent value="packages" className="mt-4">
          <CatalogPane kind="package" selectedGroup={selectedGroup} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export const ApplicationSheet = (): JSX.Element => {
  return (
    <DocumentMangementProvider>
      <ApplicationSheetBody />
    </DocumentMangementProvider>
  );
};
