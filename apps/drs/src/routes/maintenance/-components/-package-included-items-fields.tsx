import { Button } from '@repo/ui/components/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@repo/ui/components/combobox';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import {
  Controller,
  type UseFormReturn,
  useFieldArray,
  useWatch,
} from 'react-hook-form';

import { fetchDocumentGroups } from '../-lib/api/fetchDocumentGroups.ts';
import { fetchDocuments } from '../-lib/api/fetchDocuments.ts';
import { LoadingIndicator } from '../../-loading-indicator.tsx';

export type PackageIncludedItemFormValue = {
  id?: number | string | null;
  document_id?: number | null;
  label: string;
  account_code?: string | null;
  sort_order?: number | null;
};

type DocumentOption = {
  id: number;
  document_name: string;
  group_name: string;
  is_active: boolean;
};

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  name?: string;
  disabled?: boolean;
};

function IncludedItemRow({
  form,
  name,
  index,
  disabled,
  documents,
  documentsLoading,
  onRemove,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  name: string;
  index: number;
  disabled: boolean;
  documents: DocumentOption[];
  documentsLoading: boolean;
  onRemove: () => void;
}) {
  const documentId = useWatch({
    control: form.control,
    name: `${name}.${index}.document_id`,
  }) as number | null | undefined;

  const label = useWatch({
    control: form.control,
    name: `${name}.${index}.label`,
  }) as string | undefined;

  const hasDocument = documentId != null && Number(documentId) > 0;
  const selectedDoc = hasDocument
    ? (documents.find((doc) => doc.id === Number(documentId)) ?? null)
    : null;

  const labelError = form.getFieldState(
    `${name}.${index}.label`,
    form.formState,
  ).error;

  return (
    <div className="border-border space-y-2 rounded-md border p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <Label className="text-xs">
            {hasDocument ? 'Document' : 'Document or custom name'}
          </Label>
          <Combobox
            items={documents}
            value={selectedDoc}
            inputValue={label ?? ''}
            onValueChange={(next: DocumentOption | null) => {
              if (next) {
                form.setValue(`${name}.${index}.document_id`, next.id, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                });
                form.setValue(`${name}.${index}.label`, next.document_name, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                });
                form.setValue(`${name}.${index}.account_code`, '', {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                });
                return;
              }

              form.setValue(`${name}.${index}.document_id`, null, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              });
            }}
            onInputValueChange={(next: string, details) => {
              // Base UI single-select resets the input to "" on close when nothing
              // is selected (reason: input-clear). Keep custom typed names.
              if (
                next === '' &&
                details?.reason === 'input-clear' &&
                (label ?? '').trim() !== ''
              ) {
                details.cancel();
                return;
              }

              form.setValue(`${name}.${index}.label`, next, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              });

              // Typing away from the locked document name → custom item.
              if (
                hasDocument &&
                selectedDoc &&
                next !== selectedDoc.document_name
              ) {
                form.setValue(`${name}.${index}.document_id`, null, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                });
              }
            }}
            isItemEqualToValue={(a: DocumentOption, b: DocumentOption) =>
              a.id === b.id
            }
            itemToStringLabel={(doc: DocumentOption) => doc.document_name}
            itemToStringValue={(doc: DocumentOption) =>
              doc.is_active
                ? `${doc.document_name} · ${doc.group_name}`
                : `${doc.document_name} · ${doc.group_name} (Inactive)`
            }
            disabled={disabled || documentsLoading}
          >
            <ComboboxInput
              placeholder="Search documents or type a custom name…"
              showClear
              disabled={disabled || documentsLoading}
            />
            <ComboboxContent className="z-60">
              <ComboboxEmpty>No documents found.</ComboboxEmpty>
              <ComboboxList>
                {(doc: DocumentOption) => (
                  <ComboboxItem key={doc.id} value={doc}>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{doc.document_name}</span>
                      <span className="text-muted-foreground text-xs">
                        {doc.group_name}
                        {doc.is_active ? '' : ' · Inactive'}
                      </span>
                    </span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          {labelError ? (
            <p className="text-destructive text-xs">
              {labelError.message ?? 'Name is required.'}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-6"
          disabled={disabled}
          onClick={onRemove}
          aria-label={`Remove item ${index + 1}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {!hasDocument ? (
        <Controller
          control={form.control}
          name={`${name}.${index}.account_code`}
          render={({ field: input, fieldState }) => (
            <div className="space-y-1">
              <Label
                htmlFor={`${name}-${index}-account-code`}
                className="text-xs"
              >
                Account code
              </Label>
              <Input
                {...input}
                id={`${name}-${index}-account-code`}
                value={input.value ?? ''}
                disabled={disabled}
                placeholder="e.g. REG-ITEM-01"
              />
              {fieldState.error ? (
                <p className="text-destructive text-xs">
                  {fieldState.error.message}
                </p>
              ) : null}
            </div>
          )}
        />
      ) : null}
    </div>
  );
}

export function PackageIncludedItemsFields({
  form,
  name = 'included_items',
  disabled = false,
}: Props) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name,
  });

  const groupsQuery = useQuery({
    queryKey: ['document_groups'],
    queryFn: fetchDocumentGroups,
    refetchOnWindowFocus: false,
  });

  const documentsQuery = useQuery({
    queryKey: [
      'package_included_item_documents',
      groupsQuery.data?.map((group) => group.id),
    ],
    enabled: Boolean(groupsQuery.data?.length),
    queryFn: async (): Promise<DocumentOption[]> => {
      const groups = groupsQuery.data ?? [];
      const rows = await Promise.all(
        groups.map(async (group) => {
          const docs = await fetchDocuments(group.id);
          return docs.map((doc) => ({
            id: Number(doc.id),
            document_name: doc.document_name,
            group_name: group.group_name,
            is_active: doc.is_active !== false,
          }));
        }),
      );
      return rows.flat().sort((a, b) =>
        a.document_name.localeCompare(b.document_name, undefined, {
          sensitivity: 'base',
        }),
      );
    },
    refetchOnWindowFocus: false,
  });

  const documents = documentsQuery.data ?? [];
  const documentsLoading = groupsQuery.isLoading || documentsQuery.isLoading;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Included items</p>
          <p className="text-muted-foreground text-xs">
            Pick a catalog document or type a custom name. Custom lines need an
            account code.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() =>
            append({
              document_id: null,
              label: '',
              account_code: '',
              sort_order: fields.length,
            })
          }
        >
          <Plus className="h-4 w-4" />
          Add item
        </Button>
      </div>

      {documentsLoading ? (
        <div className="flex h-20 items-center justify-center">
          <LoadingIndicator label="Loading documents…" size="sm" />
        </div>
      ) : null}

      {fields.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
          No included items are configured for this package.
        </p>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <IncludedItemRow
              key={field.id}
              form={form}
              name={name}
              index={index}
              disabled={disabled}
              documents={documents}
              documentsLoading={documentsLoading}
              onRemove={() => remove(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
