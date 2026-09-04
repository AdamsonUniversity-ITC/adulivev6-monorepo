import {
  DrsEmptyState,
  DrsErrorState,
  DrsLoadingState,
  DrsOverline,
  DrsPageHeader,
  DrsPageShell,
  DrsPanel,
  DrsSearchField,
  DrsSection,
} from '@/components/drs-ui.tsx';
import { SupportingDocumentDropzone } from '@/components/supporting-document-dropzone.tsx';
import { DRS_STUDENT_APPLY_PERMISSION } from '@/lib/drsPermissions.ts';
import { fetchAuthUser, normalizePermissions } from '@/lib/fetchAuthUser.ts';
import { type TempUpload } from '@/lib/tempUploads.ts';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkPermission } from '@repo/hooks';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@repo/ui/components/accordion';
import { Button } from '@repo/ui/components/button';

import { Checkbox } from '@repo/ui/components/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import { Textarea } from '@repo/ui/components/textarea';
import { toast } from '@repo/ui/exports';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { Minus, Plus } from 'lucide-react';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { fetchPaymentCollectionSettings } from '../maintenance/-lib/api/paymentCollectionSettings.ts';
import {
  buildApplyRequestPayload,
  submitApplyRequest,
  validateApplyLineQuantities,
  type ApplySupportingUpload,
} from './-lib/api/submitApplyRequest.ts';
import {
  applyRequestFormDefaults,
  applyRequestFormSchema,
  type ApplyRequestFormValues,
} from './-lib/applyRequestSchema.ts';
import {
  eligibilityFromApiMeta,
  itemVisibleForRules,
} from './-lib/evaluateDocumentRules.ts';
import { fetchDocumentCatalog } from './-lib/fetchDocumentCatalog.ts';
import type {
  CatalogDocument,
  CatalogGroup,
  CatalogPackage,
} from './-lib/types.ts';

export const Route = createFileRoute('/apply/')({
  beforeLoad: async () => {
    const { data } = await fetchAuthUser();
    const permissions = normalizePermissions(data);
    if (!checkPermission(permissions, DRS_STUDENT_APPLY_PERMISSION)) {
      throw redirect({ to: '/' });
    }
  },
  component: ApplyDocumentsPage,
});

function parsePriceNumber(value: string | number): number {
  const n = typeof value === 'string' ? Number.parseFloat(value) : value;
  return Number.isFinite(n) ? n : 0;
}

function formatPrice(value: string | number): string {
  const n = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (Number.isNaN(n)) {
    return String(value);
  }
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function docKey(id: number): string {
  return `d:${id}`;
}

function pkgKey(id: number): string {
  return `p:${id}`;
}

const MAX_LINE_QTY = 50;

type SummaryLine = {
  key: string;
  title: string;
  kind: 'document' | 'package';
  qty: number;
  unit: number;
  line: number;
};

type SelectedSupportingRequirement = {
  documentId: number;
  documentName: string;
  requirement: NonNullable<
    CatalogDocument['supporting_document_requirements']
  >[number];
};

function supportingUploadKey(
  documentId: number,
  requirementId: number,
): string {
  return `${documentId}:${requirementId}`;
}

function getSubmitErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const data = (err as { response?: { data?: { message?: string } } })
      .response?.data;
    if (data && typeof data.message === 'string') {
      return data.message;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Could not submit request.';
}

function RuleChips({
  rules,
  max = 4,
}: {
  rules: CatalogDocument['rules'];
  max?: number;
}) {
  const list = Array.isArray(rules) ? rules : [];
  const labels = list
    .map((r) => r.rule?.display_name ?? r.rule?.rule_name)
    .filter((x): x is string => Boolean(x));

  if (labels.length === 0) {
    return null;
  }

  const shown = labels.slice(0, max);
  const rest = labels.length - shown.length;

  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {shown.map((label, i) => (
        <span
          key={`${label}-${i}`}
          className="bg-muted/80 text-muted-foreground max-w-40 truncate rounded px-1.5 py-0.5 text-[11px] leading-tight"
          title={label}
        >
          {label}
        </span>
      ))}
      {rest > 0 ? (
        <span className="text-muted-foreground rounded px-1.5 py-0.5 text-[11px]">
          +{rest}
        </span>
      ) : null}
    </div>
  );
}

type ProcessedGroup = {
  group: CatalogGroup;
  visibleDocs: CatalogDocument[];
  visiblePkgs: CatalogPackage[];
};

function ApplyDocumentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');
  const [quantities, setQuantities] = React.useState<Record<string, number>>(
    {},
  );
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [supportingUploads, setSupportingUploads] = React.useState<
    Record<string, TempUpload[]>
  >({});

  const form = useForm<ApplyRequestFormValues>({
    resolver: zodResolver(applyRequestFormSchema),
    defaultValues: applyRequestFormDefaults,
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    getValues,
    formState: { errors },
  } = form;

  const receiveMode = watch('receiveMode');
  const paymentMethodId = watch('paymentMethodId');

  const {
    data: catalog,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['drs_apply_document_catalog'],
    queryFn: fetchDocumentCatalog,
    refetchOnWindowFocus: false,
  });

  const groups = catalog?.groups ?? [];
  const ctx = eligibilityFromApiMeta(catalog?.eligibility);

  const paymentSettingsQuery = useQuery({
    queryKey: ['payment_collection_settings'],
    queryFn: fetchPaymentCollectionSettings,
    refetchOnWindowFocus: false,
  });

  const paymentMethods = paymentSettingsQuery.data?.payment_methods ?? [];
  const selectedPaymentMethod = paymentMethods.find(
    (method) => method.id === paymentMethodId,
  );

  const sortedGroups = React.useMemo(
    () =>
      [...groups].sort((a, b) =>
        (a.group_name ?? '').localeCompare(b.group_name ?? '', undefined, {
          sensitivity: 'base',
        }),
      ),
    [groups],
  );

  const sortDocs = (items: CatalogDocument[]) =>
    [...items].sort((a, b) =>
      (a.document_name ?? '').localeCompare(b.document_name ?? '', undefined, {
        sensitivity: 'base',
      }),
    );

  const sortPkgs = (items: CatalogPackage[]) =>
    [...items].sort((a, b) =>
      (a.package_name ?? '').localeCompare(b.package_name ?? '', undefined, {
        sensitivity: 'base',
      }),
    );

  const q = search.trim().toLowerCase();

  const processedGroups = React.useMemo((): ProcessedGroup[] => {
    const out: ProcessedGroup[] = [];

    for (const group of sortedGroups) {
      const docs = sortDocs(
        Array.isArray(group.documents) ? group.documents : [],
      );
      const pkgs = sortPkgs(
        Array.isArray(group.packages) ? group.packages : [],
      );

      const visibleDocs = docs.filter((d) => {
        if (!itemVisibleForRules(d.rules, ctx)) return false;
        if (!q) return true;
        return (d.document_name ?? '').toLowerCase().includes(q);
      });

      const visiblePkgs = pkgs.filter((p) => {
        if (!itemVisibleForRules(p.rules, ctx)) return false;
        if (!q) return true;
        return (p.package_name ?? '').toLowerCase().includes(q);
      });

      if (visibleDocs.length === 0 && visiblePkgs.length === 0) {
        continue;
      }

      out.push({ group, visibleDocs, visiblePkgs });
    }

    return out;
  }, [sortedGroups, ctx, q]);

  /** All rule-visible items (ignores search) so cart totals stay correct when filtering. */
  const priceIndex = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const g of sortedGroups) {
      for (const d of g.documents ?? []) {
        if (!itemVisibleForRules(d.rules, ctx)) continue;
        m.set(docKey(d.id), parsePriceNumber(d.price));
      }
      for (const p of g.packages ?? []) {
        if (!itemVisibleForRules(p.rules, ctx)) continue;
        m.set(pkgKey(p.id), parsePriceNumber(p.price));
      }
    }
    return m;
  }, [sortedGroups, ctx]);

  const maxQtyByKey = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const g of sortedGroups) {
      for (const d of g.documents ?? []) {
        if (!itemVisibleForRules(d.rules, ctx)) continue;
        if (d.once_per_student && d.already_requested) {
          m.set(docKey(d.id), 0);
          continue;
        }
        const allowMulti =
          !d.once_per_student && d.allow_multiple_per_request !== false;
        m.set(docKey(d.id), allowMulti ? MAX_LINE_QTY : 1);
      }
      for (const p of g.packages ?? []) {
        if (!itemVisibleForRules(p.rules, ctx)) continue;
        if (p.once_per_student && p.already_requested) {
          m.set(pkgKey(p.id), 0);
          continue;
        }
        const allowMulti =
          !p.once_per_student && p.allow_multiple_per_request !== false;
        m.set(pkgKey(p.id), allowMulti ? MAX_LINE_QTY : 1);
      }
    }
    return m;
  }, [sortedGroups, ctx]);

  const catalogLookup = React.useMemo(() => {
    const m = new Map<
      string,
      { title: string; kind: 'document' | 'package' }
    >();
    for (const g of sortedGroups) {
      for (const d of g.documents ?? []) {
        m.set(docKey(d.id), { title: d.document_name, kind: 'document' });
      }
      for (const p of g.packages ?? []) {
        m.set(pkgKey(p.id), { title: p.package_name, kind: 'package' });
      }
    }
    return m;
  }, [sortedGroups]);

  const companionIdsByDocId = React.useMemo(() => {
    const m = new Map<number, number[]>();
    for (const g of sortedGroups) {
      for (const d of g.documents ?? []) {
        const ids = (d.required_companion_ids ?? [])
          .map(Number)
          .filter((id) => Number.isFinite(id) && id > 0 && id !== d.id);
        if (ids.length > 0) m.set(d.id, ids);
      }
    }
    return m;
  }, [sortedGroups]);

  const documentNameById = React.useMemo(() => {
    const m = new Map<number, string>();
    for (const g of sortedGroups) {
      for (const d of g.documents ?? []) {
        m.set(d.id, d.document_name);
      }
    }
    return m;
  }, [sortedGroups]);

  const lockedCompanionMeta = React.useMemo(() => {
    const locked = new Map<string, string[]>();
    for (const [key, qty] of Object.entries(quantities)) {
      if (qty <= 0 || !key.startsWith('d:')) continue;
      const parentId = Number(key.slice(2));
      const companions = companionIdsByDocId.get(parentId) ?? [];
      const parentName = documentNameById.get(parentId) ?? 'another document';
      for (const companionId of companions) {
        const companionKey = docKey(companionId);
        const names = locked.get(companionKey) ?? [];
        if (!names.includes(parentName)) names.push(parentName);
        locked.set(companionKey, names);
      }
    }
    return locked;
  }, [quantities, companionIdsByDocId, documentNameById]);

  const summaryLines = React.useMemo((): SummaryLine[] => {
    const rows: SummaryLine[] = [];
    for (const [key, qty] of Object.entries(quantities)) {
      if (qty <= 0) continue;
      const meta = catalogLookup.get(key);
      const unit = priceIndex.get(key) ?? 0;
      rows.push({
        key,
        title: meta?.title ?? key,
        kind: meta?.kind ?? 'document',
        qty,
        unit,
        line: unit * qty,
      });
    }
    rows.sort((a, b) => a.title.localeCompare(b.title));
    return rows;
  }, [quantities, catalogLookup, priceIndex]);

  const selectedSupportingRequirements =
    React.useMemo((): SelectedSupportingRequirement[] => {
      const rows: SelectedSupportingRequirement[] = [];
      for (const group of sortedGroups) {
        for (const doc of group.documents ?? []) {
          if ((quantities[docKey(doc.id)] ?? 0) <= 0) {
            continue;
          }

          for (const requirement of doc.supporting_document_requirements ??
            []) {
            if (requirement.is_active === false) {
              continue;
            }
            rows.push({
              documentId: doc.id,
              documentName: doc.document_name,
              requirement,
            });
          }
        }
      }

      return rows;
    }, [quantities, sortedGroups]);

  const { totalSelected, lineCount, unitCount } = React.useMemo(() => {
    let total = 0;
    let lines = 0;
    let units = 0;
    for (const [key, qty] of Object.entries(quantities)) {
      if (qty <= 0) continue;
      const unit = priceIndex.get(key) ?? 0;
      total += unit * qty;
      lines += 1;
      units += qty;
    }
    return { totalSelected: total, lineCount: lines, unitCount: units };
  }, [quantities, priceIndex]);

  React.useEffect(() => {
    setQuantities((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const key of Object.keys(prev)) {
        const qty = prev[key];
        if (qty === undefined || qty <= 0) continue;
        const max = maxQtyByKey.get(key);
        if (max === undefined) {
          delete next[key];
          changed = true;
          continue;
        }
        if (qty > max) {
          if (max <= 0) {
            delete next[key];
          } else {
            next[key] = max;
          }
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [maxQtyByKey]);

  const setLineQuantity = React.useCallback(
    (key: string, qty: number) => {
      const max = maxQtyByKey.get(key) ?? 0;
      const clamped = Math.max(
        0,
        Math.min(max, Math.floor(Number.isFinite(qty) ? qty : 0)),
      );

      setQuantities((prev) => {
        const isLocked = (lockedCompanionMeta.get(key)?.length ?? 0) > 0;
        if (clamped <= 0 && isLocked) {
          toast.error(
            `This document is required with ${lockedCompanionMeta.get(key)?.join(', ')}.`,
          );
          return prev;
        }

        const next = { ...prev };
        if (clamped <= 0) {
          delete next[key];
        } else {
          next[key] = clamped;
        }

        if (key.startsWith('d:') && clamped > 0) {
          const parentId = Number(key.slice(2));
          const queue = [...(companionIdsByDocId.get(parentId) ?? [])];
          const seen = new Set<number>();
          while (queue.length > 0) {
            const companionId = queue.shift();
            if (companionId == null || seen.has(companionId)) continue;
            seen.add(companionId);
            const companionKey = docKey(companionId);
            const companionMax = maxQtyByKey.get(companionKey) ?? 1;
            const current = next[companionKey] ?? 0;
            if (current < 1) {
              next[companionKey] = Math.min(companionMax, 1);
            }
            for (const nested of companionIdsByDocId.get(companionId) ?? []) {
              queue.push(nested);
            }
          }
        }

        return next;
      });
    },
    [maxQtyByKey, companionIdsByDocId, lockedCompanionMeta],
  );

  const clearSelection = () => {
    setQuantities({});
    setSupportingUploads({});
  };

  const openReviewDialog = handleSubmit(() => {
    if (unitCount === 0) {
      toast.error('Add at least one document or package.');
      return;
    }
    setConfirmOpen(true);
  });

  const handleDialogOpenChange = (open: boolean) => {
    setConfirmOpen(open);
    if (!open) {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSubmit = async () => {
    const values = getValues();
    setIsSubmitting(true);
    try {
      const validated = validateApplyLineQuantities(quantities, maxQtyByKey);
      if (!validated.ok) {
        toast.error(validated.message);
        return;
      }
      const missingRequired = selectedSupportingRequirements.find(
        ({ documentId, requirement }) => {
          if (!requirement.is_required) return false;
          const key = supportingUploadKey(documentId, requirement.id);
          return (supportingUploads[key] ?? []).length === 0;
        },
      );
      if (missingRequired) {
        toast.error(
          `Upload ${missingRequired.requirement.name} for ${missingRequired.documentName}.`,
        );
        return;
      }

      const uploadRows: ApplySupportingUpload[] = selectedSupportingRequirements
        .map(({ documentId, requirement }) => {
          const tempUploadIds = (
            supportingUploads[
              supportingUploadKey(documentId, requirement.id)
            ] ?? []
          ).map((upload) => Number(upload.id));

          return {
            requestable_type: 'document' as const,
            requestable_id: documentId,
            requirement_id: requirement.id,
            temp_upload_ids: tempUploadIds,
          };
        })
        .filter((row) => row.temp_upload_ids.length > 0);

      const payload = buildApplyRequestPayload(
        values,
        validated.lines,
        uploadRows,
      );
      const { id } = await submitApplyRequest(payload);
      toast.success('Request submitted successfully.');
      setConfirmOpen(false);
      void navigate({
        to: '/applications/$applicationId',
        params: { applicationId: id },
      });
    } catch (err: unknown) {
      toast.error(getSubmitErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formSnapshot = confirmOpen ? getValues() : null;

  return (
    <DrsPageShell maxWidth="xl" contentClassName="space-y-5 pb-24 xl:pb-5">
      <DrsPageHeader
        backTo="/"
        backLabel="My requests"
        title="Request a document"
        description="Pick the documents you need, tell the registrar how to reach you, then review before submitting. Totals are estimates until the registrar assesses your request."
      />

      <div className="grid gap-x-10 gap-y-10 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-10">
          <DrsSection
            title="Documents"
            description="Prices shown are per copy."
            divided
            action={
              <DrsSearchField
                label="Filter catalog"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by name…"
                className="w-full sm:w-64"
              />
            }
          >
            {isLoading ? (
              <DrsLoadingState label="Loading catalog…" />
            ) : isError ? (
              <DrsErrorState
                title="Could not load the document catalog"
                description="Sign in again and open this page from your DRS address. If it keeps failing, contact the registrar."
              />
            ) : processedGroups.length === 0 ? (
              <DrsEmptyState
                title={
                  sortedGroups.length === 0
                    ? 'No documents are available yet'
                    : 'No documents match your filter'
                }
                description={
                  sortedGroups.length === 0
                    ? 'The registrar has not published a document catalog for this site yet.'
                    : 'Try a different search term, or clear the filter to see everything available to you.'
                }
                action={
                  sortedGroups.length > 0 && search ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSearch('')}
                    >
                      Clear filter
                    </Button>
                  ) : null
                }
              />
            ) : (
              <Accordion
                type="multiple"
                className="w-full"
                defaultValue={processedGroups.map(({ group }) =>
                  String(group.id),
                )}
              >
                {processedGroups.map(({ group, visibleDocs, visiblePkgs }) => (
                  <AccordionItem
                    key={group.id}
                    value={String(group.id)}
                    className="border-border/70"
                  >
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-left">
                        <span className="text-sm font-semibold">
                          {group.group_name}
                        </span>
                        <span className="text-muted-foreground text-xs font-normal tabular-nums">
                          {visibleDocs.length + visiblePkgs.length} item
                          {visibleDocs.length + visiblePkgs.length === 1
                            ? ''
                            : 's'}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-5">
                        {visibleDocs.length > 0 ? (
                          <div>
                            {visiblePkgs.length > 0 ? (
                              <DrsOverline className="mb-1">
                                Documents
                              </DrsOverline>
                            ) : null}
                            <ul className="divide-border/70 divide-y border-y">
                              {visibleDocs.map((doc) => {
                                const key = docKey(doc.id);
                                const qty = quantities[key] ?? 0;
                                return (
                                  <li key={key}>
                                    <CatalogLineRow
                                      quantity={qty}
                                      maxQuantity={maxQtyByKey.get(key) ?? 0}
                                      allowMultiple={
                                        !doc.once_per_student &&
                                        doc.allow_multiple_per_request !== false
                                      }
                                      alreadyRequested={Boolean(
                                        doc.once_per_student &&
                                        doc.already_requested,
                                      )}
                                      locked={
                                        (lockedCompanionMeta.get(key)?.length ??
                                          0) > 0
                                      }
                                      lockedByNames={
                                        lockedCompanionMeta.get(key) ?? []
                                      }
                                      onQuantityChange={(q) =>
                                        setLineQuantity(key, q)
                                      }
                                      title={doc.document_name}
                                      unitPrice={doc.price}
                                      rules={doc.rules}
                                    />
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ) : null}

                        {visiblePkgs.length > 0 ? (
                          <div>
                            <DrsOverline className="mb-1">Packages</DrsOverline>
                            <ul className="divide-border/70 divide-y border-y">
                              {visiblePkgs.map((pkg) => {
                                const key = pkgKey(pkg.id);
                                const qty = quantities[key] ?? 0;
                                return (
                                  <li key={key}>
                                    <CatalogLineRow
                                      quantity={qty}
                                      maxQuantity={maxQtyByKey.get(key) ?? 0}
                                      allowMultiple={
                                        !pkg.once_per_student &&
                                        pkg.allow_multiple_per_request !== false
                                      }
                                      alreadyRequested={Boolean(
                                        pkg.once_per_student &&
                                        pkg.already_requested,
                                      )}
                                      onQuantityChange={(q) =>
                                        setLineQuantity(key, q)
                                      }
                                      title={pkg.package_name}
                                      unitPrice={pkg.price}
                                      rules={pkg.rules}
                                      includedItems={pkg.included_items}
                                    />
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </DrsSection>

          <DrsSection
            title="Contact and delivery"
            description="How the registrar reaches you, and how you want to receive the documents."
            divided
            contentClassName="max-w-2xl"
          >
            <form
              id="apply-request-form"
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                void openReviewDialog();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="apply-email">Email</Label>
                  <Input
                    id="apply-email"
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    aria-invalid={errors.email ? true : undefined}
                  />
                  {errors.email ? (
                    <p className="text-destructive text-xs">
                      {errors.email.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="apply-contact">Contact number</Label>
                  <Input
                    id="apply-contact"
                    type="tel"
                    autoComplete="tel"
                    {...register('contactNumber')}
                    aria-invalid={errors.contactNumber ? true : undefined}
                  />
                  {errors.contactNumber ? (
                    <p className="text-destructive text-xs">
                      {errors.contactNumber.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  name="receiveMode"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <Label htmlFor="receive-mode">Receive documents by</Label>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="receive-mode" className="w-full">
                          <SelectValue placeholder="Mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pickup">
                            Pickup at registrar
                          </SelectItem>
                          <SelectItem value="delivery">
                            Courier delivery
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.receiveMode ? (
                        <p className="text-destructive text-xs">
                          {errors.receiveMode.message}
                        </p>
                      ) : null}
                    </div>
                  )}
                />

                <Controller
                  name="paymentMethodId"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <Label htmlFor="payment-method">Mode of payment</Label>
                      <Select
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                        disabled={
                          paymentSettingsQuery.isLoading ||
                          paymentMethods.length === 0
                        }
                      >
                        <SelectTrigger id="payment-method" className="w-full">
                          <SelectValue
                            placeholder={
                              paymentSettingsQuery.isLoading
                                ? 'Loading payment methods…'
                                : paymentMethods.length === 0
                                  ? 'No payment methods available'
                                  : 'Select payment method'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.id} value={method.id}>
                              {method.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedPaymentMethod?.description ? (
                        <p className="text-muted-foreground text-xs leading-5">
                          {selectedPaymentMethod.description}
                        </p>
                      ) : null}
                      {errors.paymentMethodId ? (
                        <p className="text-destructive text-xs">
                          {errors.paymentMethodId.message}
                        </p>
                      ) : null}
                      {!paymentSettingsQuery.isLoading &&
                      paymentMethods.length === 0 ? (
                        <p className="text-destructive text-xs">
                          Payment methods are not configured yet. Contact the
                          registrar.
                        </p>
                      ) : null}
                    </div>
                  )}
                />
              </div>

              {receiveMode === 'delivery' ? (
                <div className="space-y-1.5">
                  <Label htmlFor="apply-address">Delivery address</Label>
                  <Textarea
                    id="apply-address"
                    rows={3}
                    {...register('deliveryAddress')}
                    aria-invalid={errors.deliveryAddress ? true : undefined}
                  />
                  {errors.deliveryAddress ? (
                    <p className="text-destructive text-xs">
                      {errors.deliveryAddress.message}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <Controller
                name="secureEmail"
                control={control}
                render={({ field }) => (
                  <div className="flex items-start gap-2.5">
                    <Checkbox
                      id="apply-secure-email"
                      className="mt-0.5"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                    <div>
                      <Label htmlFor="apply-secure-email">
                        Also email me a secure PDF copy
                      </Label>
                      <p className="text-muted-foreground text-xs">
                        A password-protected PDF is sent to your email address.
                      </p>
                    </div>
                  </div>
                )}
              />

              <div className="space-y-1.5">
                <Label htmlFor="apply-purpose">Purpose (optional)</Label>
                <Textarea
                  id="apply-purpose"
                  rows={2}
                  placeholder="e.g. employment abroad, scholarship"
                  {...register('purpose')}
                  aria-invalid={errors.purpose ? true : undefined}
                />
                {errors.purpose ? (
                  <p className="text-destructive text-xs">
                    {errors.purpose.message}
                  </p>
                ) : null}
              </div>
            </form>
          </DrsSection>
        </div>

        <aside className="hidden xl:sticky xl:top-28 xl:block xl:self-start">
          <DrsPanel title="Your request" contentClassName="space-y-4">
            {lineCount === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nothing selected yet. Choose a document to see your estimated
                total here.
              </p>
            ) : (
              <ul className="divide-border/70 divide-y border-b text-sm">
                {summaryLines.map((line) => (
                  <li
                    key={line.key}
                    className="flex items-baseline justify-between gap-3 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block">{line.title}</span>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        &times;{line.qty}
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums">
                      PHP {formatPrice(line.line)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-baseline justify-between gap-3">
              <span className="text-muted-foreground text-xs">
                Estimated total
              </span>
              <span className="text-xl font-semibold tabular-nums">
                PHP {formatPrice(totalSelected)}
              </span>
            </div>

            <Button
              type="submit"
              form="apply-request-form"
              className="w-full"
              disabled={isLoading || unitCount === 0}
            >
              Review and submit
            </Button>

            {unitCount > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground w-full"
                onClick={clearSelection}
              >
                Clear selection
              </Button>
            ) : null}
          </DrsPanel>
        </aside>
      </div>

      {/* Mobile equivalent of the summary rail. */}
      <div className="bg-background/95 supports-backdrop-filter:bg-background/85 fixed inset-x-0 bottom-0 z-30 border-t px-4 py-3 backdrop-blur xl:hidden">
        <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs">
              {unitCount} cop{unitCount === 1 ? 'y' : 'ies'} · estimated
            </p>
            <p className="text-base font-semibold tabular-nums">
              PHP {formatPrice(totalSelected)}
            </p>
          </div>
          <Button
            type="submit"
            form="apply-request-form"
            disabled={isLoading || unitCount === 0}
          >
            Review and submit
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent
          className="max-h-[min(90vh,720px)] gap-0 overflow-auto p-0 sm:max-w-6xl"
          showCloseButton={!isSubmitting}
        >
          <div className="max-h-[min(90vh,720px)] overflow-y-auto p-6 pb-4">
            <DialogHeader>
              <DialogTitle>Confirm your request</DialogTitle>
              <DialogDescription>
                Review documents and packages. Totals match your cart. Submit
                only if everything looks correct.
              </DialogDescription>
            </DialogHeader>

            {formSnapshot ? (
              <div className="mt-4 space-y-5 text-sm">
                <section className="space-y-2">
                  <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    Contact
                  </h4>
                  <dl className="border-border divide-border/80 divide-y rounded-lg border text-xs">
                    <div className="flex justify-between gap-3 px-3 py-2">
                      <dt className="text-muted-foreground shrink-0">Email</dt>
                      <dd className="text-right break-all">
                        {formSnapshot.email}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 px-3 py-2">
                      <dt className="text-muted-foreground shrink-0">
                        Contact
                      </dt>
                      <dd className="text-right">
                        {formSnapshot.contactNumber}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 px-3 py-2">
                      <dt className="text-muted-foreground shrink-0">
                        Receive by
                      </dt>
                      <dd className="text-right capitalize">
                        {formSnapshot.receiveMode}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 px-3 py-2">
                      <dt className="text-muted-foreground shrink-0">
                        Mode of payment
                      </dt>
                      <dd className="text-right">
                        {selectedPaymentMethod?.name ??
                          formSnapshot.paymentMethodId}
                      </dd>
                    </div>
                    {selectedPaymentMethod?.description ? (
                      <div className="flex justify-between gap-3 px-3 py-2">
                        <dt className="text-muted-foreground shrink-0">
                          Payment notes
                        </dt>
                        <dd className="max-w-[60%] text-right whitespace-pre-wrap">
                          {selectedPaymentMethod.description}
                        </dd>
                      </div>
                    ) : null}
                    {formSnapshot.secureEmail ? (
                      <div className="flex justify-between gap-3 px-3 py-2">
                        <dt className="text-muted-foreground shrink-0">
                          Secure email (PDF)
                        </dt>
                        <dd className="text-right">Yes</dd>
                      </div>
                    ) : null}
                    {formSnapshot.receiveMode === 'delivery' &&
                    formSnapshot.deliveryAddress?.trim() ? (
                      <div className="flex justify-between gap-3 px-3 py-2">
                        <dt className="text-muted-foreground shrink-0">
                          Address
                        </dt>
                        <dd className="max-w-[60%] text-right whitespace-pre-wrap">
                          {formSnapshot.deliveryAddress.trim()}
                        </dd>
                      </div>
                    ) : null}
                    {formSnapshot.purpose?.trim() ? (
                      <div className="flex justify-between gap-3 px-3 py-2">
                        <dt className="text-muted-foreground shrink-0">
                          Purpose
                        </dt>
                        <dd className="max-w-[60%] text-right whitespace-pre-wrap">
                          {formSnapshot.purpose.trim()}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </section>

                <section className="space-y-2">
                  <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    Items
                  </h4>
                  <div className="border-border max-h-56 overflow-y-auto rounded-lg border">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted text-muted-foreground sticky top-0">
                        <tr>
                          <th className="px-2 py-2 font-medium">Item</th>
                          <th className="px-2 py-2 font-medium">Type</th>
                          <th className="px-2 py-2 text-right font-medium">
                            Qty
                          </th>
                          <th className="px-2 py-2 text-right font-medium">
                            Line
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {summaryLines.map((row) => (
                          <tr
                            key={row.key}
                            className="border-border/60 border-t first:border-t-0"
                          >
                            <td className="max-w-40 px-2 py-1.5 align-top">
                              <span className="line-clamp-2" title={row.title}>
                                {row.title}
                              </span>
                            </td>
                            <td className="text-muted-foreground px-2 py-1.5 capitalize">
                              {row.kind}
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums">
                              {row.qty}
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums">
                              PHP {formatPrice(row.line)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-right text-sm font-semibold tabular-nums">
                    Estimated total: PHP {formatPrice(totalSelected)}
                  </p>
                </section>

                {selectedSupportingRequirements.length > 0 ? (
                  <section className="space-y-3">
                    <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                      Supporting uploads
                    </h4>
                    <div className="space-y-4">
                      {selectedSupportingRequirements.map(
                        ({ documentId, documentName, requirement }) => {
                          const key = supportingUploadKey(
                            documentId,
                            requirement.id,
                          );

                          return (
                            <div key={key} className="rounded-lg border p-3">
                              <p className="mb-2 text-xs font-semibold">
                                {documentName}
                              </p>
                              <SupportingDocumentDropzone
                                label={requirement.name}
                                description={requirement.instructions}
                                required={requirement.is_required}
                                maxFiles={requirement.max_files ?? 1}
                                maxSizeKb={requirement.max_file_size_kb}
                                allowedMimeTypes={
                                  requirement.allowed_mime_types ?? []
                                }
                                value={supportingUploads[key] ?? []}
                                disabled={isSubmitting}
                                onChange={(uploads) =>
                                  setSupportingUploads((prev) => ({
                                    ...prev,
                                    [key]: uploads,
                                  }))
                                }
                              />
                            </div>
                          );
                        },
                      )}
                    </div>
                  </section>
                ) : null}
              </div>
            ) : null}
          </div>

          <DialogFooter className="border-border bg-muted/20 gap-2 border-t p-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogOpenChange(false)}
              disabled={isSubmitting}
            >
              Go back
            </Button>
            <Button
              type="button"
              onClick={() => void handleConfirmSubmit()}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting…' : 'Confirm request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DrsPageShell>
  );
}

function CatalogLineRow({
  quantity,
  maxQuantity,
  allowMultiple,
  alreadyRequested = false,
  onQuantityChange,
  title,
  unitPrice,
  rules,
  includedItems,
  locked = false,
  lockedByNames = [],
}: {
  quantity: number;
  maxQuantity: number;
  allowMultiple: boolean;
  alreadyRequested?: boolean;
  onQuantityChange: (qty: number) => void;
  title: string;
  unitPrice: string | number;
  rules: CatalogDocument['rules'];
  includedItems?: Array<{ id: number; label: string }>;
  locked?: boolean;
  lockedByNames?: string[];
}) {
  const unit = parsePriceNumber(unitPrice);
  const lineTotal = unit * quantity;
  const inCart = quantity > 0;
  const unavailable = alreadyRequested || maxQuantity <= 0;

  const setInCart = (checked: boolean) => {
    if (unavailable) {
      toast.error(
        'This item can only be requested once and was already requested.',
      );
      return;
    }
    if (!checked && locked) {
      toast.error(
        `This document is required with ${lockedByNames.join(', ') || 'another document'}.`,
      );
      return;
    }
    if (checked) {
      onQuantityChange(Math.min(maxQuantity, Math.max(1, quantity)));
    } else {
      onQuantityChange(0);
    }
  };

  const toggleInCart = () => {
    if (unavailable) {
      toast.error(
        'This item can only be requested once and was already requested.',
      );
      return;
    }
    setInCart(!inCart);
  };

  return (
    <div
      role="presentation"
      onClick={toggleInCart}
      className={`flex cursor-pointer flex-col gap-3 px-1 py-3 transition-colors sm:flex-row sm:flex-nowrap sm:items-start ${
        unavailable
          ? 'cursor-not-allowed opacity-55'
          : inCart
            ? 'bg-muted/50'
            : 'hover:bg-muted/30'
      }`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div
          className="pt-0.5"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={inCart}
            disabled={unavailable || (locked && inCart)}
            onCheckedChange={(v) => setInCart(v === true)}
            aria-label={`Include ${title} in request`}
            className="size-5 sm:size-4"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug font-medium">{title}</p>
          {includedItems && includedItems.length > 0 ? (
            <ul className="text-muted-foreground mt-1.5 list-disc space-y-0.5 pl-4 text-xs leading-snug">
              {includedItems.map((item) => (
                <li key={item.id}>{item.label}</li>
              ))}
            </ul>
          ) : null}
          <div className="text-muted-foreground mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs tabular-nums">
            <span>PHP {formatPrice(unit)} each</span>
            {inCart ? (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  {quantity} x PHP {formatPrice(unit)} ={' '}
                  <span className="text-foreground font-semibold">
                    PHP {formatPrice(lineTotal)}
                  </span>
                </span>
              </>
            ) : null}
          </div>
          <RuleChips rules={rules} />
          {locked ? (
            <p className="text-muted-foreground mt-1 text-[11px] leading-snug">
              Required with {lockedByNames.join(', ')}. Locked while that
              document is selected.
            </p>
          ) : null}
          {alreadyRequested ? (
            <p className="text-muted-foreground mt-1 text-[11px] leading-snug">
              Already requested. This item can only be requested once.
            </p>
          ) : !allowMultiple ? (
            <p className="text-muted-foreground mt-1 text-[11px] leading-snug">
              One copy per request.
            </p>
          ) : null}
        </div>
      </div>
      <div
        className="flex shrink-0 items-center justify-end gap-1"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="size-9 sm:size-7"
          disabled={unavailable || quantity <= 0 || (locked && quantity <= 1)}
          aria-label={`Decrease quantity of ${title}`}
          onClick={() => onQuantityChange(quantity - 1)}
        >
          <Minus className="size-3.5" />
        </Button>
        <span
          className="text-foreground min-w-9 px-1 text-center text-sm font-semibold tabular-nums sm:min-w-7"
          aria-live="polite"
        >
          {quantity}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="size-9 sm:size-7"
          disabled={unavailable || quantity >= maxQuantity}
          aria-label={`Increase quantity of ${title}`}
          onClick={() => onQuantityChange(quantity + 1)}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
