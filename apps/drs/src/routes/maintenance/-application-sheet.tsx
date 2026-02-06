import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { JSX } from 'react';
import { DisplayGroup } from './-display-group.tsx';
import { DocumentSelector } from './-document-selector.tsx';
import { PackageSelector } from './-package-selector.tsx';

const documents = ['Diploma', 'Transcript of Records', 'Good Moral Character'];
export const ApplicationSheet = (): JSX.Element => {
  return (
    <div className="bg-background min-h-screen p-4">
      <div className="mx-auto max-w-4xl space-y-8">
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

        <Card className="border-border border">
          <CardHeader>
            <CardTitle>Document Packages</CardTitle>
            <CardDescription>
              Create and manage document bundles for convenient requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PackageSelector />
          </CardContent>
        </Card>

        {/* <Dialog open={showAddDocDialog} onOpenChange={setShowAddDocDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Document</DialogTitle>
                <DialogDescription>
                  Create a new document type that can be requested
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="doc-name">Document Name</Label>
                  <Input
                    id="doc-name"
                    placeholder="e.g., Honorable Dismissal"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doc-description">
                    Description (optional)
                  </Label>
                  <Textarea
                    id="doc-description"
                    placeholder="Brief description of the document..."
                    value={documentDescription}
                    onChange={(e) => setDocumentDescription(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDocDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddDocument}
                    disabled={!documentName.trim()}
                  >
                    Add Document
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog> */}
      </div>
    </div>
  );
};
