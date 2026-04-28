import { JSX } from 'react';
import { DisplayGroup } from './-components/-display-group.tsx';
import { DocumentSelector } from './-components/-document-selector.tsx';
import { PackageSelector } from './-components/-package-selector.tsx';
import { DocumentMangementProvider } from './-providers/-document-management-context.tsx';

export const ApplicationSheet = (): JSX.Element => {
  return (
    <DocumentMangementProvider>
      <div className="bg-background min-h-screen p-4">
        <div className="w-full space-y-8">
          <div className="space-y-2">
            <h1 className="text-foreground text-3xl font-bold">
              Document Management
            </h1>
            <p className="text-muted-foreground">
              Manage documents, access permissions, and document packages
            </p>
          </div>
          <DisplayGroup />
          <DocumentSelector />
          <PackageSelector />
        </div>
      </div>
    </DocumentMangementProvider>
  );
};
