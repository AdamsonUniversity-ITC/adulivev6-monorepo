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
import { FormSwitch } from '@repo/ui/form-components/form-switch';

import { toast } from '@repo/ui/exports';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Edit, Loader, Plus, Settings, Trash2 } from 'lucide-react';
import { JSX, useContext, useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import z from 'zod';
import { createDocument } from '../-lib/api/createDocument.ts';
import { editDocument } from '../-lib/api/editDocument.ts';
import { fetchDocument } from '../-lib/api/fetchDocument.ts';
import { fetchDocuments } from '../-lib/api/fetchDocuments.ts';
import { DocumentManagementContext } from '../-providers/-document-management-context.tsx';
import { Route } from '../index.tsx';

interface Document {
  value: string;
  label: string;
}

const new_document_schema = z.object({
  document_name: z
    .string()
    .min(1, { message: 'This field is required.' })
    .max(255),
  price: z.coerce.number().min(0).max(999999999),
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
        queryClient.invalidateQueries({
          queryKey: ['documents', selectedGroup],
        });
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
            <FormInput form={form} name="price" type="number" label="Price" />
            <FormSwitch
              form={form}
              name="is_active"
              label="Active"
              desc="Temporarily enable/disable this document. "
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button disabled={newDocument.isPending}>Add Document</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const document_schema = z.object({
  document_name: z
    .string()
    .min(1, { message: 'This field is requried. ' })
    .max(255),
  price: z.coerce
    .string()
    .max(9, { message: 'Price cannot have more than 9 characters.' })
    .min(1, { message: 'This field is required' }),
  rules: z.object({
    graduate: z.coerce.boolean(),
    undergraduate: z.coerce.boolean(),
    enrolled: z.coerce.boolean(),
    unenrolled: z.coerce.boolean(),
  }),
  is_active: z.coerce.boolean(),
});

const DocumentDetails = () => {
  const queryClient = useQueryClient();
  const { selectedDocument, selectedGroup } = useContext(
    DocumentManagementContext,
  );
  const form = useForm({
    resolver: zodResolver(document_schema),
    defaultValues: {},
  });

  const { data, isFetching, isLoading } = useQuery({
    queryKey: ['document', selectedDocument?.id],
    queryFn: () => fetchDocument(selectedDocument.id),
    enabled: !!selectedDocument?.id,
  });

  const mutation = useMutation({
    mutationFn: (formValues) => editDocument(selectedDocument.id, formValues),
  });

  useEffect(() => {
    if (data) {
      form.reset({
        document_name: data.document_name,
        price: data.price,
        rules: {
          graduate: false,
          undergraduate: false,
          enrolled: false,
          unenrolled: false,
        },
        is_active: data.is_active,
      });

      data.rules?.forEach((rule) => {
        if (rule.rule.rule_type === 'toggle') {
          form.setValue(`rules.${rule.rule.rule_name}`, true);
        }
      });
    }
  }, [data]);

  const handleSubmit = (formValues) => {
    mutation.mutate(formValues, {
      onSuccess: () => {
        toast.success('Document updated successfully.');
        queryClient.invalidateQueries({
          queryKey: [`documents`, selectedGroup],
        });

        queryClient.invalidateQueries({
          queryKey: [`documents`, selectedGroup],
        });
      },
    });
  };

  const isActive = useWatch({
    control: form.control,
    name: 'is_active',
  });

  if (!selectedDocument) return null;
  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      <Card className="border-border border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <CardTitle className="text-2xl">
                <FormInput
                  form={form}
                  name="document_name"
                  label="Document name"
                />
              </CardTitle>
            </div>
            <Badge
              variant={isActive ? 'default' : 'secondary'}
              className="whitespace-nowrap"
            >
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {isFetching ? (
            <div className="h-80">
              <p className="text-center text-sm">Loading data...</p>
              <Loader className="mx-auto mt-4 animate-spin" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h3 className="text-foreground text-sm font-semibold">Cost</h3>
                <div className="flex items-center gap-2">
                  <span className="text-foreground text-3xl font-bold">
                    <FormInput form={form} name="price" />
                  </span>
                  <span className="text-muted-foreground text-sm">
                    per copy
                  </span>
                </div>
              </div>

              <div className="border-border space-y-3 border-t pt-2">
                <h3 className="text-foreground text-sm font-semibold">
                  Status
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-muted-foreground mb-2 text-sm">
                      This document is {!isActive && 'not'} currently available
                      for requests
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => form.setValue('is_active', !isActive)}
                    size="sm"
                  >
                    {isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm">Rules</p>
                <Separator className="my-4" />
                <FormCheckbox
                  form={form}
                  name="rules.undergraduate"
                  label="Undergraduate"
                />

                <FormCheckbox
                  form={form}
                  name="rules.graduate"
                  label="Graduate"
                />
                <FormCheckbox
                  form={form}
                  name="rules.enrolled"
                  label="Enrolled"
                />
                <FormCheckbox
                  form={form}
                  name="rules.unenrolled"
                  label="Not Enrolled"
                />
              </div>

              <div className="border-border flex gap-2 border-t pt-4">
                <Button
                  disabled={mutation.isPending}
                  variant="outline"
                  className="flex-1 bg-transparent"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Save
                </Button>
                <Button
                  disabled={mutation.isPending}
                  type="button"
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10 flex-1 bg-transparent"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </form>
  );
};

export const DocumentSelector = (): JSX.Element => {
  const [showAdminDialog, setShowAdminDialog] = useState<boolean>(false);

  const {
    selectedGroup,
    setSelectedDocument,
    setSelectedGroup,
    selectedDocument,
  } = useContext(DocumentManagementContext);
  const { access } = Route.useLoaderData();
  const { data, isFetching } = useQuery({
    refetchOnWindowFocus: false,
    queryKey: ['documents', selectedGroup],
    queryFn: () => fetchDocuments(access, selectedGroup),
    enabled: !!selectedGroup,
    retry: false,
  });

  const documents = useMemo(() => {
    if (!data?.data) {
      return [];
    }
    setSelectedDocument(null);
    return data.data.map((item) => ({
      value: item.id,
      label: `${item.price} - ${item.document_name}`,
      ...item,
    }));
  }, [data?.data ?? []]);

  return (
    <Card className="border-border border">
      <CardHeader>
        <CardTitle>Document Selection</CardTitle>
        <CardDescription>
          Choose a document to configure access or add a new one
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!selectedGroup ? (
          <>
            <p className="text-center text-sm">Select document group first</p>
          </>
        ) : (
          <>
            {isFetching ? (
              <p className="text-center text-sm">Loading documents...</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-2">
                    <label className="text-foreground text-sm font-medium">
                      Select Document
                    </label>
                    <Combobox
                      disabled={isFetching || !selectedGroup}
                      itemToStringValue={(item) => item.label}
                      value={selectedDocument}
                      onValueChange={setSelectedDocument}
                      items={documents}
                    >
                      <ComboboxInput placeholder="Select a document" />
                      <ComboboxContent>
                        <ComboboxEmpty>No items found.</ComboboxEmpty>
                        <ComboboxList>
                          {(item) => (
                            <ComboboxItem
                              className="pointer-events-auto"
                              key={String(item.value)}
                              value={item}
                            >
                              ₱{item.label}
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
                  open={showAdminDialog}
                  onOpenChange={setShowAdminDialog}
                >
                  {selectedDocument && <DocumentDetails />}
                </Dialog>
                <AddDocumentDialog />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
