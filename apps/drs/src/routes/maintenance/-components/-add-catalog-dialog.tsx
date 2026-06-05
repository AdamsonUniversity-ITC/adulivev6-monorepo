import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/dialog';
import { toast } from '@repo/ui/exports';
import { FormCheckbox } from '@repo/ui/form-components/form-checkbox';
import { FormInput } from '@repo/ui/form-components/form-input';
import { FormSwitch } from '@repo/ui/form-components/form-switch';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { createDocument } from '../-lib/api/createDocument.ts';
import { createPackage } from '../-lib/api/createPackage.ts';
import type { CatalogKind } from './-types.ts';

const catalogFormSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }).max(255),
  price: z.coerce.number().min(0).max(999999999),
  is_active: z.boolean(),
  allow_multiple_per_request: z.boolean(),
});

type FormValues = z.infer<typeof catalogFormSchema>;

type Props = {
  kind: CatalogKind;
  selectedGroup: string;
};

const KIND_COPY: Record<CatalogKind, { label: string; placeholder: string }> = {
  document: { label: 'document', placeholder: 'e.g. Diploma' },
  package: {
    label: 'package',
    placeholder: 'e.g. Transfer Credentials Package',
  },
};

export const AddCatalogDialog = ({ kind, selectedGroup }: Props) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const copy = KIND_COPY[kind];

  const form = useForm<FormValues>({
    resolver: zodResolver(catalogFormSchema),
    defaultValues: {
      name: '',
      price: 0,
      is_active: true,
      allow_multiple_per_request: true,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (kind === 'document') {
        return createDocument(
          {
            document_name: values.name,
            price: values.price,
            is_active: values.is_active,
            allow_multiple_per_request: values.allow_multiple_per_request,
          },
          selectedGroup,
        );
      }

      return createPackage(
        {
          package_name: values.name,
          price: values.price,
          is_active: values.is_active,
          allow_multiple_per_request: values.allow_multiple_per_request,
        },
        selectedGroup,
      );
    },
    onSuccess: () => {
      toast.success(`${copy.label[0]?.toUpperCase()}${copy.label.slice(1)} added.`);
      form.reset();
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: [`${kind}s`, selectedGroup] });
    },
    onError: () => {
      toast.error(`Failed to add ${copy.label}.`);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add {copy.label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add new {copy.label}</DialogTitle>
          <DialogDescription>
            Create a new {copy.label} that can be requested.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="space-y-4"
        >
          <FormInput
            form={form}
            name="name"
            label="Name"
            placeholder={copy.placeholder}
          />
          <FormInput form={form} name="price" type="number" label="Price" />
          <FormSwitch
            form={form}
            name="is_active"
            label="Active"
            desc="Temporarily enable or disable this item."
          />
          <FormCheckbox
            form={form}
            name="allow_multiple_per_request"
            label="Allow multiple in one request"
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              Add {copy.label}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
