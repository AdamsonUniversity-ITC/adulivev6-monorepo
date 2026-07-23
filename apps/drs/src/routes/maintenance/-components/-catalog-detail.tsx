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
import { Label } from '@repo/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import { Separator } from '@repo/ui/components/separator';
import { toast } from '@repo/ui/exports';
import { FormCheckbox } from '@repo/ui/form-components/form-checkbox';
import { FormInput } from '@repo/ui/form-components/form-input';
import { FormSwitch } from '@repo/ui/form-components/form-switch';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { useContext, useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { editDocument } from '../-lib/api/editDocument.ts';
import { editPackage } from '../-lib/api/editPackage.ts';
import {
  type DocumentDetail,
  fetchDocument,
} from '../-lib/api/fetchDocument.ts';
import { fetchDocumentGroups } from '../-lib/api/fetchDocumentGroups.ts';
import { type PackageDetail, fetchPackage } from '../-lib/api/fetchPackage.ts';
import { DocumentManagementContext } from '../-providers/-document-management-context.tsx';
import { LoadingIndicator } from '../../-loading-indicator.tsx';
import {
  type PackageIncludedItemFormValue,
  PackageIncludedItemsFields,
} from './-package-included-items-fields.tsx';
import { RequiredCompanionsFields } from './-required-companions-fields.tsx';
import {
  type SupportingRequirementFormValue,
  SupportingRequirementsFields,
} from './-supporting-requirements-fields.tsx';
import { type CatalogKind, EMPTY_CATALOG_RULES } from './-types.ts';

const detailFormSchema = z.object({
  name: z.string().min(1, { message: 'This field is required.' }).max(255),
  price: z.coerce.number().min(0).max(999999999),
  account_code: z
    .string()
    .min(1, { message: 'Account code is required.' })
    .max(50),
  group_id: z.string().min(1, { message: 'Group is required.' }),
  is_active: z.boolean(),
  allow_multiple_per_request: z.boolean(),
  once_per_student: z.boolean(),
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
  required_companion_ids: z.array(z.number().int().positive()),
  included_items: z.array(
    z.object({
      id: z.union([z.string(), z.number()]).nullable().optional(),
      label: z.string().min(1, { message: 'This field is required.' }).max(255),
      sort_order: z.number().nullable().optional(),
    }),
  ),
});

type DetailFormValues = z.infer<typeof detailFormSchema>;

type Props = {
  kind: CatalogKind;
  itemId: string | number;
  selectedGroup: string;
  onBeforeGroupSwitch?: () => void;
};

const detailToForm = (
  kind: CatalogKind,
  detail: DocumentDetail | PackageDetail,
  fallbackGroupId: string,
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
    account_code: String(detail.account_code ?? ''),
    group_id:
      detail.group_id != null ? String(detail.group_id) : fallbackGroupId,
    is_active: Boolean(detail.is_active),
    allow_multiple_per_request: detail.allow_multiple_per_request !== false,
    once_per_student: Boolean(detail.once_per_student),
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
    required_companion_ids:
      kind === 'document'
        ? ((detail as DocumentDetail).required_companion_ids ?? []).map(Number)
        : [],
    included_items:
      kind === 'package'
        ? ((detail as PackageDetail).included_items ?? []).map(
            (item, index) => ({
              id: item.id,
              label: item.label,
              sort_order: item.sort_order ?? index,
            }),
          )
        : [],
  };
};

export const CatalogDetail = ({
  kind,
  itemId,
  selectedGroup,
  onBeforeGroupSwitch,
}: Props) => {
  const queryClient = useQueryClient();
  const ctx = useContext(DocumentManagementContext);
  if (!ctx) {
    throw new Error(
      'CatalogDetail must be used within DocumentMangementProvider',
    );
  }
  const { setSelectedGroup } = ctx;

  const detailQuery = useQuery({
    queryKey: [`${kind}_detail`, itemId],
    queryFn: () =>
      kind === 'document' ? fetchDocument(itemId) : fetchPackage(itemId),
    enabled: Boolean(itemId),
    refetchOnWindowFocus: false,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['document_groups'],
    queryFn: fetchDocumentGroups,
    refetchOnWindowFocus: false,
  });

  const form = useForm<DetailFormValues>({
    resolver: zodResolver(detailFormSchema),
    defaultValues: {
      name: '',
      price: 0,
      account_code: '',
      group_id: selectedGroup,
      is_active: true,
      allow_multiple_per_request: true,
      once_per_student: false,
      rules: { ...EMPTY_CATALOG_RULES },
      supporting_document_requirements: [],
      required_companion_ids: [],
      included_items: [],
    },
  });

  const isActive = useWatch({ control: form.control, name: 'is_active' });
  const oncePerStudent = useWatch({
    control: form.control,
    name: 'once_per_student',
  });

  useEffect(() => {
    if (!detailQuery.data) return;
    form.reset(detailToForm(kind, detailQuery.data, selectedGroup));
  }, [detailQuery.data, kind, form, selectedGroup]);

  useEffect(() => {
    if (!oncePerStudent) return;
    form.setValue('allow_multiple_per_request', false);
  }, [oncePerStudent, form]);

  const mutation = useMutation({
    mutationFn: (values: DetailFormValues) => {
      const groupId = Number(values.group_id);
      if (kind === 'document') {
        return editDocument(itemId, {
          document_name: values.name,
          price: values.price,
          account_code: values.account_code,
          is_active: values.is_active,
          allow_multiple_per_request: values.once_per_student
            ? false
            : values.allow_multiple_per_request,
          once_per_student: values.once_per_student,
          group_id: groupId,
          rules: values.rules,
          supporting_document_requirements:
            values.supporting_document_requirements.map((item, index) => ({
              ...item,
              sort_order: index,
            })) as SupportingRequirementFormValue[],
          required_companion_ids: values.required_companion_ids,
        });
      }

      return editPackage(itemId, {
        package_name: values.name,
        price: values.price,
        account_code: values.account_code,
        is_active: values.is_active,
        allow_multiple_per_request: values.once_per_student
          ? false
          : values.allow_multiple_per_request,
        once_per_student: values.once_per_student,
        group_id: groupId,
        package_rules: values.rules,
        included_items: values.included_items.map((item, index) => ({
          ...item,
          sort_order: index,
        })) as PackageIncludedItemFormValue[],
      });
    },
    onSuccess: (_data, values) => {
      const newGroupId = String(values.group_id);
      const groupChanged = newGroupId !== String(selectedGroup);

      toast.success(
        kind === 'document' ? 'Document updated.' : 'Package updated.',
      );

      queryClient.invalidateQueries({
        queryKey: [`${kind}s`, selectedGroup],
      });
      if (groupChanged) {
        queryClient.invalidateQueries({
          queryKey: [`${kind}s`, newGroupId],
        });
        onBeforeGroupSwitch?.();
        setSelectedGroup(newGroupId);
      }
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
            <FormInput
              form={form}
              name="account_code"
              label="Account code"
              placeholder="e.g. REG-DOC-01"
            />
            <Controller
              control={form.control}
              name="group_id"
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <Label htmlFor={`${kind}-group-select`}>
                    {kind === 'document' ? 'Document group' : 'Package group'}
                  </Label>
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    disabled={mutation.isPending || groups.length === 0}
                  >
                    <SelectTrigger id={`${kind}-group-select`}>
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={String(group.id)}>
                          {group.group_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error ? (
                    <p className="text-destructive text-xs">
                      {fieldState.error.message}
                    </p>
                  ) : null}
                </div>
              )}
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
              disabled={oncePerStudent}
            />
            <FormCheckbox
              form={form}
              name="once_per_student"
              label="Can only be requested once"
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
              <Separator />
              <RequiredCompanionsFields
                form={form}
                currentDocumentId={itemId}
                disabled={mutation.isPending}
              />
            </>
          ) : (
            <>
              <Separator />
              <PackageIncludedItemsFields
                form={form}
                disabled={mutation.isPending}
              />
            </>
          )}

          <div className="border-border flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              disabled={mutation.isPending || !form.formState.isDirty}
              onClick={() =>
                detailQuery.data &&
                form.reset(detailToForm(kind, detailQuery.data, selectedGroup))
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
