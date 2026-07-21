import { Button } from '@repo/ui/components/button';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Label } from '@repo/ui/components/label';
import { useQuery } from '@tanstack/react-query';
import type { UseFormReturn } from 'react-hook-form';

import { fetchDocumentGroups } from '../-lib/api/fetchDocumentGroups.ts';
import { fetchDocuments } from '../-lib/api/fetchDocuments.ts';
import { LoadingIndicator } from '../../-loading-indicator.tsx';

type CompanionOption = {
  id: number;
  document_name: string;
  group_name: string;
};

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  currentDocumentId: string | number;
  disabled?: boolean;
};

export function RequiredCompanionsFields({
  form,
  currentDocumentId,
  disabled = false,
}: Props) {
  const selected = form.watch('required_companion_ids') ?? [];
  const currentId = Number(currentDocumentId);

  const groupsQuery = useQuery({
    queryKey: ['document_groups'],
    queryFn: fetchDocumentGroups,
    refetchOnWindowFocus: false,
  });

  const optionsQuery = useQuery({
    queryKey: [
      'document_companion_options',
      groupsQuery.data?.map((g) => g.id),
    ],
    enabled: Boolean(groupsQuery.data?.length),
    queryFn: async (): Promise<CompanionOption[]> => {
      const groups = groupsQuery.data ?? [];
      const rows = await Promise.all(
        groups.map(async (group) => {
          const docs = await fetchDocuments(group.id);
          return docs.map((doc) => ({
            id: Number(doc.id),
            document_name: doc.document_name,
            group_name: group.group_name,
          }));
        }),
      );
      return rows
        .flat()
        .filter((doc) => doc.id !== currentId)
        .sort((a, b) =>
          a.document_name.localeCompare(b.document_name, undefined, {
            sensitivity: 'base',
          }),
        );
    },
    refetchOnWindowFocus: false,
  });

  const toggle = (documentId: number, checked: boolean) => {
    const next = checked
      ? Array.from(new Set([...selected, documentId]))
      : selected.filter((id) => id !== documentId);
    form.setValue('required_companion_ids', next, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Required companion documents</p>
          <p className="text-muted-foreground text-xs">
            When a student requests this document, these companions are
            auto-added and locked until this document is removed. One-way only
            (e.g. Diploma requires TOR, but TOR does not require Diploma).
          </p>
        </div>
        {selected.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() =>
              form.setValue('required_companion_ids', [], {
                shouldDirty: true,
                shouldTouch: true,
              })
            }
          >
            Clear
          </Button>
        ) : null}
      </div>

      {groupsQuery.isLoading || optionsQuery.isLoading ? (
        <div className="flex h-24 items-center justify-center">
          <LoadingIndicator label="Loading documents…" size="sm" />
        </div>
      ) : optionsQuery.data?.length ? (
        <ul className="border-border max-h-56 space-y-2 overflow-y-auto rounded-lg border p-3">
          {optionsQuery.data.map((doc) => {
            const checked = selected.includes(doc.id);
            const inputId = `companion-${doc.id}`;
            return (
              <li key={doc.id} className="flex items-start gap-2">
                <Checkbox
                  id={inputId}
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={(value) => toggle(doc.id, value === true)}
                />
                <Label
                  htmlFor={inputId}
                  className="cursor-pointer leading-snug font-normal"
                >
                  <span className="block text-sm">{doc.document_name}</span>
                  <span className="text-muted-foreground text-xs">
                    {doc.group_name}
                  </span>
                </Label>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-muted-foreground text-xs">
          No other documents available to link.
        </p>
      )}
    </div>
  );
}
