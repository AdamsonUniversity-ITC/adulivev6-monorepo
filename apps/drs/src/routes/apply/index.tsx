import { DrsSearchField } from '@/components/drs-ui.tsx';
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
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
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
import { ScrollArea } from '@repo/ui/components/scroll-area';
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
import { Link, createFileRoute, redirect } from '@tanstack/react-router';
import { ChevronLeft, Minus, Plus } from 'lucide-react';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { LoadingIndicator } from '../-loading-indicator.tsx';
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
  PLACEHOLDER_STUDENT_CONTEXT,
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
  const ctx = PLACEHOLDER_STUDENT_CONTEXT;
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

  const {
    data: groups = [],
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['drs_apply_document_catalog'],
    queryFn: fetchDocumentCatalog,
    refetchOnWindowFocus: false,
  });

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
        const allowMulti = d.allow_multiple_per_request !== false;
        m.set(docKey(d.id), allowMulti ? MAX_LINE_QTY : 1);
      }
      for (const p of g.packages ?? []) {
        if (!itemVisibleForRules(p.rules, ctx)) continue;
        const allowMulti = p.allow_multiple_per_request !== false;
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
        const next = { ...prev };
        if (clamped <= 0) {
          delete next[key];
        } else {
          next[key] = clamped;
        }
        return next;
      });
    },
    [maxQtyByKey],
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
      await submitApplyRequest(payload);
      toast.success('Request submitted successfully.');
      setConfirmOpen(false);
      clearSelection();
      reset(applyRequestFormDefaults);
    } catch (err: unknown) {
      toast.error(getSubmitErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formSnapshot = confirmOpen ? getValues() : null;

  return (
    <div className="drs-surface text-foreground relative min-h-screen">
      <header className="border-border/80 bg-background/90 sticky top-14 z-30 border-b backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/">
                  <ChevronLeft />
                </Link>
              </Button>
              <p className="text-primary text-xs font-semibold tracking-wider uppercase">
                Document requests
              </p>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Build your request
            </h1>
            <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
              Search the catalog, set quantities, fill in your contact details,
              then review and confirm. <strong>Estimated</strong> total uses
              unit price × copies.
            </p>
          </div>

          <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:items-end">
            <div className="border-border bg-card/80 flex flex-col rounded-2xl border px-4 py-3 shadow-sm sm:min-w-[200px]">
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                  Est. total
                </span>
                <Badge variant="secondary" className="tabular-nums">
                  {lineCount} line{lineCount === 1 ? '' : 's'} · {unitCount}
                  &nbsp;
                  {unitCount === 1 ? 'copy' : 'copies'}
                </Badge>
              </div>
              <p className="text-primary mt-1 text-right text-3xl font-semibold tabular-nums">
                PHP {formatPrice(totalSelected)}
              </p>
              <p className="text-muted-foreground mt-1 text-right text-xs">
                {unitCount === 0
                  ? 'Use + / checkboxes below to add copies.'
                  : 'Review before submitting.'}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground mt-2 h-8 self-end text-xs"
                onClick={clearSelection}
                disabled={unitCount === 0}
              >
                Clear selection
              </Button>
            </div>
          </div>
        </div>
        <div className="mb-4 flex items-center justify-center">
          <div className="w-full max-w-6xl px-4">
            <DrsSearchField
              label="Filter catalog"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by document or package name…"
              inputClassName="bg-card/80 border-border/80 shadow-sm"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <Card className="drs-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Contact & delivery</CardTitle>
            <CardDescription>
              Used by the registrar to reach you. You will confirm line items in
              the next step.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void openReviewDialog();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
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
                <div className="space-y-2">
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

              <Controller
                name="receiveMode"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="receive-mode">Receive documents by</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="receive-mode"
                        className="w-full sm:max-w-md"
                      >
                        <SelectValue placeholder="Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pickup">
                          Pickup at registrar
                        </SelectItem>
                        <SelectItem value="email">
                          Secure email (PDF)
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

              {receiveMode === 'delivery' ? (
                <div className="space-y-2">
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

              <div className="space-y-2">
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

              <Button type="submit" disabled={isLoading || unitCount === 0}>
                Review & submit
              </Button>
            </form>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="border-border bg-card/40 flex h-48 items-center justify-center rounded-2xl border">
            <LoadingIndicator label="Loading catalog…" size="md" />
          </div>
        ) : isError ? (
          <div className="border-destructive/30 bg-destructive/5 text-destructive flex h-48 items-center justify-center rounded-2xl border px-4 text-center text-sm">
            Could not load documents. Sign in and open this app from your DRS
            subdomain.
          </div>
        ) : processedGroups.length === 0 ? (
          <div className="border-border bg-card/40 text-muted-foreground flex h-48 items-center justify-center rounded-2xl border text-sm">
            {sortedGroups.length === 0
              ? 'No document groups available yet.'
              : 'No items match your search or profile for this view.'}
          </div>
        ) : (
          <ScrollArea className="border-border bg-card/30 h-[min(70vh,calc(100vh-16rem))] rounded-2xl border shadow-inner">
            <div className="p-4 pr-6 pb-8">
              <Accordion
                type="multiple"
                className="w-full space-y-1"
                defaultValue={processedGroups.map(({ group }) =>
                  String(group.id),
                )}
              >
                {processedGroups.map(({ group, visibleDocs, visiblePkgs }) => (
                  <AccordionItem
                    key={group.id}
                    value={String(group.id)}
                    className="border-border data-[state=open]:bg-muted/20 mb-4 rounded-xl border px-3 transition-colors"
                  >
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="flex flex-col items-start gap-1 text-left sm:flex-row sm:items-center sm:gap-3">
                        <span className="text-base font-semibold">
                          {group.group_name}
                        </span>
                        <span className="text-muted-foreground text-xs font-normal">
                          {visibleDocs.length} document(s) ·{' '}
                          {visiblePkgs.length} package(s)
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      <div className="overflow-x-hidden overflow-y-auto pr-1">
                        <div className="space-y-4 pr-2">
                          {visibleDocs.length > 0 ? (
                            <section className="space-y-2">
                              <h2 className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
                                Documents
                              </h2>
                              <ul className="space-y-2">
                                {visibleDocs.map((doc) => {
                                  const key = docKey(doc.id);
                                  const qty = quantities[key] ?? 0;
                                  return (
                                    <li key={key}>
                                      <CatalogLineRow
                                        quantity={qty}
                                        maxQuantity={maxQtyByKey.get(key) ?? 0}
                                        allowMultiple={
                                          doc.allow_multiple_per_request !==
                                          false
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
                            </section>
                          ) : null}

                          {visiblePkgs.length > 0 ? (
                            <section className="space-y-2">
                              <h2 className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
                                Packages
                              </h2>
                              <ul className="space-y-2">
                                {visiblePkgs.map((pkg) => {
                                  const key = pkgKey(pkg.id);
                                  const qty = quantities[key] ?? 0;
                                  return (
                                    <li key={key}>
                                      <CatalogLineRow
                                        quantity={qty}
                                        maxQuantity={maxQtyByKey.get(key) ?? 0}
                                        allowMultiple={
                                          pkg.allow_multiple_per_request !==
                                          false
                                        }
                                        onQuantityChange={(q) =>
                                          setLineQuantity(key, q)
                                        }
                                        title={pkg.package_name}
                                        unitPrice={pkg.price}
                                        rules={pkg.rules}
                                      />
                                    </li>
                                  );
                                })}
                              </ul>
                            </section>
                          ) : null}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </ScrollArea>
        )}
      </main>

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
    </div>
  );
}

function CatalogLineRow({
  quantity,
  maxQuantity,
  allowMultiple,
  onQuantityChange,
  title,
  unitPrice,
  rules,
}: {
  quantity: number;
  maxQuantity: number;
  allowMultiple: boolean;
  onQuantityChange: (qty: number) => void;
  title: string;
  unitPrice: string | number;
  rules: CatalogDocument['rules'];
}) {
  const unit = parsePriceNumber(unitPrice);
  const lineTotal = unit * quantity;
  const inCart = quantity > 0;

  const setInCart = (checked: boolean) => {
    if (checked) {
      onQuantityChange(Math.min(maxQuantity, Math.max(1, quantity)));
    } else {
      onQuantityChange(0);
    }
  };

  const toggleInCart = () => {
    setInCart(!inCart);
  };

  return (
    <div
      role="presentation"
      onClick={toggleInCart}
      className={`border-border flex cursor-pointer flex-wrap items-stretch gap-3 rounded-xl border p-3 transition-all sm:flex-nowrap ${
        inCart
          ? 'border-primary/40 bg-primary/5 ring-primary/15 shadow-sm ring-1'
          : 'hover:border-primary/20 hover:bg-muted/25'
      }`}
    >
      <div
        className="pt-0.5"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={inCart}
          onCheckedChange={(v) => setInCart(v === true)}
          aria-label={`Include ${title} in request`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="leading-snug font-medium">{title}</p>
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
        {!allowMultiple ? (
          <p className="text-muted-foreground mt-1 text-[11px] leading-snug">
            One copy per request.
          </p>
        ) : null}
      </div>
      <div
        className="border-border/60 bg-background/80 flex shrink-0 items-center gap-1 self-center rounded-lg border px-1 py-0.5"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="size-8"
          disabled={quantity <= 0}
          aria-label={`Decrease quantity of ${title}`}
          onClick={() => onQuantityChange(quantity - 1)}
        >
          <Minus className="size-3.5" />
        </Button>
        <span
          className="text-foreground min-w-8 px-1 text-center text-sm font-semibold tabular-nums"
          aria-live="polite"
        >
          {quantity}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="size-8"
          disabled={quantity >= maxQuantity}
          aria-label={`Increase quantity of ${title}`}
          onClick={() => onQuantityChange(quantity + 1)}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
