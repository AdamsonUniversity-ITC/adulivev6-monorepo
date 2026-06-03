import { Badge } from '@repo/ui/components/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  type DocumentListItem,
  fetchDocuments,
} from '../-lib/api/fetchDocuments.ts';
import {
  type PackageListItem,
  fetchPackages,
} from '../-lib/api/fetchPackages.ts';
import { LoadingIndicator } from '../../-loading-indicator.tsx';
import { AddCatalogDialog } from './-add-catalog-dialog.tsx';
import { CatalogDetail } from './-catalog-detail.tsx';
import type { CatalogItem, CatalogKind } from './-types.ts';

type Props = {
  kind: CatalogKind;
  selectedGroup: string | null;
};

const KIND_COPY: Record<
  CatalogKind,
  { listTitle: string; listDescription: string; emptyText: string }
> = {
  document: {
    listTitle: 'Documents',
    listDescription: 'Items that can be requested individually.',
    emptyText: 'No documents in this group yet.',
  },
  package: {
    listTitle: 'Packages',
    listDescription: 'Bundled items that can be requested together.',
    emptyText: 'No packages in this group yet.',
  },
};

const toCatalogItem = (
  kind: CatalogKind,
  raw: DocumentListItem | PackageListItem,
): CatalogItem => ({
  id: raw.id,
  name:
    kind === 'document'
      ? (raw as DocumentListItem).document_name
      : (raw as PackageListItem).package_name,
  price: Number(raw.price ?? 0),
  is_active: Boolean(raw.is_active),
  allow_multiple_per_request: raw.allow_multiple_per_request !== false,
});

export const CatalogPane = ({ kind, selectedGroup }: Props) => {
  const copy = KIND_COPY[kind];
  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  const listQuery = useQuery({
    queryKey: [`${kind}s`, selectedGroup],
    queryFn: () =>
      kind === 'document'
        ? fetchDocuments(selectedGroup as string)
        : fetchPackages(selectedGroup as string),
    enabled: Boolean(selectedGroup),
    refetchOnWindowFocus: false,
  });

  const items = useMemo<CatalogItem[]>(() => {
    return (listQuery.data ?? []).map((raw) => toCatalogItem(kind, raw));
  }, [listQuery.data, kind]);

  useEffect(() => {
    setSelectedId(null);
  }, [selectedGroup]);

  useEffect(() => {
    if (selectedId === null) return;
    if (!items.some((item) => String(item.id) === String(selectedId))) {
      setSelectedId(null);
    }
  }, [items, selectedId]);

  if (!selectedGroup) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground text-sm">
            Pick a group above to manage its {kind === 'document' ? 'documents' : 'packages'}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-base">{copy.listTitle}</CardTitle>
            <CardDescription className="text-xs">
              {items.length} item(s). {copy.listDescription}
            </CardDescription>
          </div>
          <AddCatalogDialog kind={kind} selectedGroup={selectedGroup} />
        </CardHeader>
        <CardContent className="space-y-1">
          {listQuery.isLoading ? (
            <LoadingIndicator
              label={`Loading ${kind === 'document' ? 'documents' : 'packages'}…`}
              variant="block"
            />
          ) : listQuery.isError ? (
            <p className="text-destructive py-4 text-sm">
              Failed to load {kind === 'document' ? 'documents' : 'packages'}.
            </p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground py-4 text-sm">
              {copy.emptyText}
            </p>
          ) : (
            items.map((item) => {
              const isSelected = String(item.id) === String(selectedId);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-accent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.name}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        ₱{item.price.toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      variant={item.is_active ? 'default' : 'secondary'}
                      className="shrink-0"
                    >
                      {item.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </button>
              );
            })
          )}
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        {selectedId !== null ? (
          <CatalogDetail
            kind={kind}
            itemId={selectedId}
            selectedGroup={selectedGroup}
          />
        ) : (
          <Card>
            <CardContent className="flex h-full items-center justify-center py-16">
              <p className="text-muted-foreground text-sm">
                Select an item from the list to edit its details.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
