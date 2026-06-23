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
import { Separator } from '@repo/ui/components/separator';
import { toast } from '@repo/ui/exports';
import { FormCheckbox } from '@repo/ui/form-components/form-checkbox';
import { FormInput } from '@repo/ui/form-components/form-input';
import { FormSwitch } from '@repo/ui/form-components/form-switch';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { editDocument } from '../-lib/api/editDocument.ts';
import { editPackage } from '../-lib/api/editPackage.ts';
import {
  type DocumentDetail,
  fetchDocument,
} from '../-lib/api/fetchDocument.ts';
import { type PackageDetail, fetchPackage } from '../-lib/api/fetchPackage.ts';
import { LoadingIndicator } from '../../-loading-indicator.tsx';
import {
  type SupportingRequirementFormValue,
  SupportingRequirementsFields,
} from './-supporting-requirements-fields.tsx';
import { type CatalogKind, EMPTY_CATALOG_RULES } from './-types.ts';

const detailFormSchema = z.object({
  name: z.string().min(1, { message: 'This field is required.' }).max(255),
  price: z.coerce.number().min(0).max(999999999),
  is_active: z.boolean(),
  allow_multiple_per_request: z.boolean(),
  rules: z.object({
    graduate: z.boolean(),
    undergraduate: z.boolean(),
    enrolled: z.boolean(),
    unenrolled: z.boolean(),
  }),
  supporting_document_requirements: z.array(
    z.object({
      id: z.union([z.string(), z.number()]).nullable().optional(),
      name: z.string().min(1, { message: 'This field is required.' }).max(255),
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

type DetailFormValues = z.infer<typeof detailFormSchema>;

type Props = {
  kind: CatalogKind;
  itemId: string | number;
  selectedGroup: string;
};

const detailToForm = (
  kind: CatalogKind,
  detail: DocumentDetail | PackageDetail,
): DetailFormValues => {
  const rules = { ...EMPTY_CATALOG_RULES };
  detail.rules?.forEach((entry) => {
    if (entry.rule.rule_type !== 'toggle') return;
    const key = entry.rule.rule_name as keyof typeof rules;
    if (key in rules) rules[key] = true;
  });

  const name =
    kind === 'document'
      ? (detail as DocumentDetail).document_name
      : (detail as PackageDetail).package_name;

  return {
    name,
    price: Number(detail.price ?? 0),
    is_active: Boolean(detail.is_active),
    allow_multiple_per_request: detail.allow_multiple_per_request !== false,
    rules,
    supporting_document_requirements:
      kind === 'document'
        ? (
            (detail as DocumentDetail).supporting_document_requirements ?? []
          ).map((requirement, index) => ({
            id: requirement.id,
            name: requirement.name,
            instructions: requirement.instructions ?? '',
            is_required: Boolean(requirement.is_required),
            is_active: requirement.is_active !== false,
            sort_order: requirement.sort_order ?? index,
            allowed_mime_types: requirement.allowed_mime_types ?? [],
            max_file_size_kb: requirement.max_file_size_kb ?? null,
            max_files: requirement.max_files ?? 1,
          }))
        : [],
  };
};

export const CatalogDetail = ({ kind, itemId, selectedGroup }: Props) => {
  const queryClient = useQueryClient();

  const detailQuery = useQuery({
    queryKey: [`${kind}_detail`, itemId],
    queryFn: () =>
      kind === 'document' ? fetchDocument(itemId) : fetchPackage(itemId),
    enabled: Boolean(itemId),
    refetchOnWindowFocus: false,
  });

  const form = useForm<DetailFormValues>({
    resolver: zodResolver(detailFormSchema),
    defaultValues: {
      name: '',
      price: 0,
      is_active: true,
      allow_multiple_per_request: true,
      rules: { ...EMPTY_CATALOG_RULES },
      supporting_document_requirements: [],
    },
  });

  const isActive = useWatch({ control: form.control, name: 'is_active' });

  useEffect(() => {
    if (!detailQuery.data) return;
    form.reset(detailToForm(kind, detailQuery.data));
  }, [detailQuery.data, kind, form]);

  const mutation = useMutation({
    mutationFn: (values: DetailFormValues) => {
      if (kind === 'document') {
        return editDocument(itemId, {
          document_name: values.name,
          price: values.price,
          is_active: values.is_active,
          allow_multiple_per_request: values.allow_multiple_per_request,
          rules: values.rules,
          supporting_document_requirements:
            values.supporting_document_requirements.map((item, index) => ({
              ...item,
              sort_order: index,
            })) as SupportingRequirementFormValue[],
        });
      }

      return editPackage(itemId, {
        package_name: values.name,
        price: values.price,
        is_active: values.is_active,
        allow_multiple_per_request: values.allow_multiple_per_request,
        package_rules: values.rules,
      });
    },
    onSuccess: () => {
      toast.success(
        kind === 'document' ? 'Document updated.' : 'Package updated.',
      );
      queryClient.invalidateQueries({
        queryKey: [`${kind}s`, selectedGroup],
      });
      queryClient.invalidateQueries({ queryKey: [`${kind}_detail`, itemId] });
    },
    onError: () => {
      toast.error(`Failed to update ${kind}.`);
    },
  });

  if (detailQuery.isFetching && !detailQuery.data) {
    return (
      <Card>
        <CardContent className="flex h-60 items-center justify-center">
          <LoadingIndicator label="Loading details…" size="md" />
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">
              {kind === 'document' ? 'Document details' : 'Package details'}
            </CardTitle>
            <CardDescription className="text-xs">
              Update pricing, availability, and rules.
            </CardDescription>
          </div>
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormInput
              form={form}
              name="name"
              label={kind === 'document' ? 'Document name' : 'Package name'}
            />
            <FormInput
              form={form}
              name="price"
              type="number"
              label="Price (per copy)"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormSwitch
              form={form}
              name="is_active"
              label="Active"
              desc="Disable to hide this item from new requests."
            />
            <FormCheckbox
              form={form}
              name="allow_multiple_per_request"
              label="Allow multiple in one request"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">Eligibility rules</p>
            <p className="text-muted-foreground text-xs">
              Restrict who can request this item by toggling categories.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
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
                label="Not enrolled"
              />
            </div>
          </div>

          {kind === 'document' ? (
            <>
              <Separator />
              <SupportingRequirementsFields
                form={form}
                disabled={mutation.isPending}
              />
            </>
          ) : null}

          <div className="border-border flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              disabled={mutation.isPending || !form.formState.isDirty}
              onClick={() =>
                detailQuery.data &&
                form.reset(detailToForm(kind, detailQuery.data))
              }
            >
              Reset
            </Button>
            <Button
              type="submit"
              className="gap-2"
              disabled={mutation.isPending || !form.formState.isDirty}
            >
              <Save className="h-4 w-4" />
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};
