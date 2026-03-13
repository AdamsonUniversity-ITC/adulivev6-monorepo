import { zodResolver } from '@hookform/resolvers/zod';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@repo/ui/components/combobox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/dialog';
import { Separator } from '@repo/ui/components/separator';
import { FormCheckbox } from '@repo/ui/form-components/form-checkbox';
import { FormInput } from '@repo/ui/form-components/form-input';

import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Edit, Plus, Settings, Trash2 } from 'lucide-react';
import { JSX, useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod';
import { createDocument } from '../-lib/api/createDocument.ts';
import { fetchDocuments } from '../-lib/api/fetchDocuments.ts';
import { DocumentManagementContext } from '../-providers/-document-management-context.tsx';
import { Route } from '../index.tsx';

interface Document {
  value: string;
  label: string;
}

interface DocumentSelectorProps {
  onAddDocument?: () => void;
}

const new_document_schema = z.object({
  document_name: z
    .string()
    .min(1, { message: 'This field is required.' })
    .max(255),
  price: z.number().min(0).max(999999999),
  is_active: z.boolean(),
});

const AddDocumentDialog = () => {
  const queryClient = useQueryClient();
  const { selectedGroup } = useContext(DocumentManagementContext);
  const form = useForm({
    resolver: zodResolver(new_document_schema),
    defaultValues: {
      document_name: '',
      price: 0,
      is_active: true,
    },
  });

  const newDocument = useMutation({
    mutationFn: (e) => createDocument(e, selectedGroup),
  });

  const onSubmit = (formValues) => {
    newDocument.mutate(formValues, {
      onSuccess: () => {
        toast('Document added successfully.');
        form.reset();
        queryClient.invalidateQueries([`documents-${selectedGroup}`]);
      },
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full bg-transparent">
          <Plus className="mr-2 h-4 w-4" />
          Add New Document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Document</DialogTitle>
          <DialogDescription>
            Create a new document type that can be requested
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <FormInput
              form={form}
              name="document_name"
              label="Document Name"
              placeholder="Diploma"
            />
            <FormInput form={form} name="price" type="numeric" label="Price" />

            <div className="flex justify-end gap-3 pt-4">
              <Button disabled={newDocument.isPending}>Add Document</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const DocumentDetails = () => {
  return (
    <Card className="border-border border">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <CardTitle className="text-2xl">Diploma</CardTitle>
            <CardDescription>Desc</CardDescription>
          </div>
          <Badge className="whitespace-nowrap">
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3" />
              Active
            </span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-foreground text-sm font-semibold">Cost</h3>
          <div className="flex items-center gap-2">
            <span className="text-foreground text-3xl font-bold">₱1000</span>
            <span className="text-muted-foreground text-sm">per copy</span>
          </div>
        </div>

        <div className="border-border space-y-3 border-t pt-2">
          <h3 className="text-foreground text-sm font-semibold">Status</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-muted-foreground mb-2 text-sm">
                This document is currently available for requests
              </p>
            </div>
            <Button size="sm">Activate</Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm">Rules</p>
          <Separator className="my-4" />
          <FormCheckbox name="is_graduate" label="Graduate" />
          <FormCheckbox name="is_enrolled" label="Enrolled" />
          <FormCheckbox name="not_enrolled" label="Not Enrolled" />
        </div>

        <div className="border-border flex gap-2 border-t pt-4">
          <Button variant="outline" className="flex-1 bg-transparent">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:bg-destructive/10 flex-1 bg-transparent"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const DocumentSelector = ({
  onAddDocument,
}: DocumentSelectorProps): JSX.Element => {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );
  const [showAdminDialog, setShowAdminDialog] = useState<boolean>(false);

  const { selectedGroup } = useContext(DocumentManagementContext);
  const { access } = Route.useLoaderData();
  const { data, isLoading, refetch } = useQuery({
    refetchOnWindowFocus: false,
    queryKey: [`documents-${selectedGroup}`],
    queryFn: () => fetchDocuments(access, selectedGroup),
    enabled: false,
    retry: false,
  });

  useEffect(() => {
    if (selectedGroup) {
      refetch();
    }
  }, [selectedGroup]);

  return (
    <Card className="border-border border">
      <CardHeader>
        <CardTitle>Document Selection</CardTitle>
        <CardDescription>
          Choose a document to configure access or add a new one
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <label className="text-foreground text-sm font-medium">
                Select Document
              </label>
              <Combobox
                disabled={isLoading}
                itemToStringValue={(item) => item.label}
                value={selectedDocument}
                onValueChange={setSelectedDocument}
                items={data?.data ?? []}
              >
                <ComboboxInput placeholder="Select a document" />
                <ComboboxContent>
                  <ComboboxEmpty>No items found.</ComboboxEmpty>
                  <ComboboxList>
                    {(item) => (
                      <ComboboxItem
                        className="pointer-events-auto"
                        key={item.value}
                        value={item}
                      >
                        {item.label}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            <Button
              className="mb-2"
              variant="outline"
              size="icon"
              onClick={() => setShowAdminDialog(true)}
              disabled={!selectedDocument}
              title="Configure access permissions"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          <Dialog
            onOpenChange={setShowAdminDialog}
            open={Boolean(showAdminDialog)}
          >
            <>{selectedDocument && <DocumentDetails />}</>
          </Dialog>
          <AddDocumentDialog />
        </div>
      </CardContent>
    </Card>
  );
};
