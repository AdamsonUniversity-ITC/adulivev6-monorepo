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
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { createDocument } from '../-lib/api/createDocument.ts';
import { createPackage } from '../-lib/api/createPackage.ts';
import {
  SupportingRequirementsFields,
  type SupportingRequirementFormValue,
} from './-supporting-requirements-fields.tsx';
import type { CatalogKind } from './-types.ts';

const catalogFormSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }).max(255),
  price: z.coerce.number().min(0).max(999999999),
  account_code: z
    .string()
    .min(1, { message: 'Account code is required.' })
    .max(50),
  is_active: z.boolean(),
  allow_multiple_per_request: z.boolean(),
  once_per_student: z.boolean(),
  supporting_document_requirements: z.array(
    z.object({
      name: z.string().min(1, { message: 'Name is required.' }).max(255),
      instructions: z.string().nullable().optional(),
      is_required: z.boolean(),
      is_active: z.boolean(),
      sort_order: z.number().nullable().optional(),
      allowed_mime_types: z.array(z.string()).optional(),
      max_file_size_kb: z.number().nullable().optional(),
      max_files: z.number().min(1).max(20).nullable().optional(),
    }),
  ),
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
      account_code: '',
      is_active: true,
      allow_multiple_per_request: true,
      once_per_student: false,
      supporting_document_requirements: [],
    },
  });

  const oncePerStudent = useWatch({
    control: form.control,
    name: 'once_per_student',
  });

  useEffect(() => {
    if (!oncePerStudent) return;
    form.setValue('allow_multiple_per_request', false);
  }, [oncePerStudent, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (kind === 'document') {
        return createDocument(
          {
            document_name: values.name,
            price: values.price,
            account_code: values.account_code,
            is_active: values.is_active,
            allow_multiple_per_request: values.once_per_student
              ? false
              : values.allow_multiple_per_request,
            once_per_student: values.once_per_student,
            supporting_document_requirements:
              values.supporting_document_requirements.map((item, index) => ({
                ...item,
                sort_order: index,
              })) as SupportingRequirementFormValue[],
          },
          selectedGroup,
        );
      }

      return createPackage(
        {
          package_name: values.name,
          price: values.price,
          account_code: values.account_code,
          is_active: values.is_active,
          allow_multiple_per_request: values.once_per_student
            ? false
            : values.allow_multiple_per_request,
          once_per_student: values.once_per_student,
        },
        selectedGroup,
      );
    },
    onSuccess: () => {
      toast.success(
        `${copy.label[0]?.toUpperCase()}${copy.label.slice(1)} added.`,
      );
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
          <FormInput
            form={form}
            name="account_code"
            label="Account code"
            placeholder="e.g. REG-DOC-01"
          />
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
            disabled={oncePerStudent}
          />
          <FormCheckbox
            form={form}
            name="once_per_student"
            label="Can only be requested once"
          />

          {kind === 'document' ? (
            <SupportingRequirementsFields
              form={form}
              disabled={mutation.isPending}
            />
          ) : null}

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
