import { Button } from '@repo/ui/components/button';
import { Checkbox } from '@repo/ui/components/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileUp, Plus, Search, Trash2 } from 'lucide-react';
import * as React from 'react';

import {
  DrsDataItem,
  DrsDataList,
  DrsOverline,
  DrsPanel,
  DrsSection,
  DrsStatusBadge,
  formatStatusLabel,
} from '@/components/drs-ui.tsx';
import { SupportingDocumentDropzone } from '@/components/supporting-document-dropzone.tsx';
import { handlePrivateFileDownloadClick } from '@/lib/downloadPrivateFile.ts';
import { formatExpiryTime } from '@/lib/formatExpiryTime.ts';
import { formatFileSize, type TempUpload } from '@/lib/tempUploads.ts';
import { ApplicationMessagesPanel } from './-application-messages-panel.tsx';
import { postApplicationSupportingRequirementUploads } from './-lib/api/postApplicationSupportingRequirementUploads.ts';
import {
  type DRSApplicationClearanceRow,
  type DRSApplicationDetail,
} from './-lib/types/applications.ts';
import { LoadingIndicator } from './-loading-indicator.tsx';
import {
  eligibilityFromApiMeta,
  itemVisibleForRules,
} from './apply/-lib/evaluateDocumentRules.ts';
import { fetchDocumentCatalog } from './apply/-lib/fetchDocumentCatalog.ts';
import type { CatalogGroup } from './apply/-lib/types.ts';

export const MAX_LINE_QTY = 50;

export type DraftLine = {
  requestable_type: 'document' | 'package';
  requestable_id: number;
  quantity: number;
  label: string;
};

type CatalogPickRow = {
  kind: 'document' | 'package';
  id: number;
  name: string;
  groupName: string;
  allow_multiple_per_request: boolean;
};

export function isPaymentCollectionOpen(app: DRSApplicationDetail): boolean {
  if (app.payment_submission) return false;

  return (
    app.status === 'for_payment' ||
    app.current_stage?.slug === 'for_payment' ||
    Boolean(
      app.active_stage_tasks?.some(
        (task) =>
          task.kind === 'payment_collection' &&
          (task.status === 'pending' || task.status === 'in_progress'),
      ),
    )
  );
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
}

function paymentBreakdownFor(app: DRSApplicationDetail) {
  const lines =
    app.lines
      ?.filter((line) => line.assessed_unit_price != null && !line.is_cancelled)
      .map((line) => {
        const unitPrice = line.assessed_unit_price ?? 0;
        return {
          id: line.id,
          label: line.request_name,
          quantity: line.quantity,
          unitPrice,
          amount: unitPrice * line.quantity,
        };
      }) ?? [];

  const otherFees =
    app.assessment_other_fees?.map((fee, index) => ({
      id: `${fee.fee_name}-${index}`,
      label: fee.fee_name,
      amount: fee.amount,
    })) ?? [];

  const computedTotal =
    lines.reduce((sum, line) => sum + line.amount, 0) +
    otherFees.reduce((sum, fee) => sum + fee.amount, 0);
  const total =
    typeof app.payment_total === 'number' ? app.payment_total : computedTotal;

  return {
    lines,
    otherFees,
    total,
    hasBreakdown: lines.length > 0 || otherFees.length > 0,
    hasAmount: lines.length > 0 || otherFees.length > 0 || total > 0,
  };
}

export function AddCatalogLinesDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (pick: {
    requestable_type: 'document' | 'package';
    requestable_id: number;
    label: string;
    allow_multiple_per_request: boolean;
  }) => void;
}) {
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const catalogQuery = useQuery({
    queryKey: ['drs-document-catalog'],
    queryFn: fetchDocumentCatalog,
    enabled: open,
    staleTime: 60_000,
  });

  const ctx = eligibilityFromApiMeta(catalogQuery.data?.eligibility);
  const q = search.trim().toLowerCase();
  const pickRows = React.useMemo(() => {
    const groups: CatalogGroup[] = catalogQuery.data?.groups ?? [];
    const out: CatalogPickRow[] = [];
    for (const g of groups) {
      const docs = (g.documents ?? []).filter(
        (d) => d.is_active && itemVisibleForRules(d.rules, ctx),
      );
      const pkgs = (g.packages ?? []).filter(
        (p) => p.is_active && itemVisibleForRules(p.rules, ctx),
      );
      const groupLc = g.group_name.toLowerCase();
      for (const d of docs) {
        const nameLc = d.document_name.toLowerCase();
        if (q !== '' && !nameLc.includes(q) && !groupLc.includes(q)) continue;
        out.push({
          kind: 'document',
          id: d.id,
          name: d.document_name,
          groupName: g.group_name,
          allow_multiple_per_request: Boolean(d.allow_multiple_per_request),
        });
      }
      for (const p of pkgs) {
        const nameLc = p.package_name.toLowerCase();
        if (q !== '' && !nameLc.includes(q) && !groupLc.includes(q)) continue;
        out.push({
          kind: 'package',
          id: p.id,
          name: p.package_name,
          groupName: g.group_name,
          allow_multiple_per_request: Boolean(p.allow_multiple_per_request),
        });
      }
    }

    return out.sort(
      (a, b) =>
        a.groupName.localeCompare(b.groupName) || a.name.localeCompare(b.name),
    );
  }, [catalogQuery.data, ctx, q]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add document or package</DialogTitle>
          <DialogDescription>
            Choose from the registrar catalog. If an item allows multiple
            copies, picking it again increases the quantity.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-2.5 left-2 h-4 w-4"
            aria-hidden="true"
          />
          <Input
            className="pl-8"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {catalogQuery.isLoading ? (
          <LoadingIndicator label="Loading catalog..." />
        ) : catalogQuery.isError ? (
          <p className="text-destructive text-sm">Could not load catalog.</p>
        ) : pickRows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No matching items.</p>
        ) : (
          <ScrollArea className="h-[min(320px,calc(85vh-220px))] rounded-md border p-2">
            <ul className="space-y-1 pr-2">
              {pickRows.map((row) => (
                <li key={`${row.kind}-${row.id}`}>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto w-full justify-start gap-2 py-2 text-left"
                    onClick={() =>
                      onPick({
                        requestable_type: row.kind,
                        requestable_id: row.id,
                        label: row.name,
                        allow_multiple_per_request:
                          row.allow_multiple_per_request,
                      })
                    }
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {row.name}
                      </span>
                      <span className="text-muted-foreground block truncate text-xs">
                        {row.groupName} -{' '}
                        {row.kind === 'package' ? 'Package' : 'Document'}
                      </span>
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

function formatPickupDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Sticky rail on the detail pages. Answers "where is this request and what
 * happens next" without the reader scanning the whole record.
 */
export function RequestSummaryPanel({
  app,
  action,
  footnote,
}: {
  app: DRSApplicationDetail;
  action?: React.ReactNode;
  footnote?: React.ReactNode;
}) {
  const breakdown = paymentBreakdownFor(app);
  const activeLines =
    app.lines?.filter((line) => !line.is_cancelled).length ?? 0;

  return (
    <DrsPanel contentClassName="space-y-4">
      <div>
        <p className="text-muted-foreground text-xs">Total amount due</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {breakdown.hasAmount
              ? formatMoney(breakdown.total)
              : 'Not assessed'}
          </p>
          {breakdown.hasAmount ? (
            <DrsStatusBadge tone={app.is_paid ? 'success' : 'warning'}>
              {app.is_paid ? 'Paid' : 'Unpaid'}
            </DrsStatusBadge>
          ) : null}
        </div>
      </div>

      <dl className="divide-border/70 divide-y border-t text-sm">
        <div className="flex items-baseline justify-between gap-3 py-2">
          <dt className="text-muted-foreground text-xs">Current stage</dt>
          <dd className="text-right font-medium">
            {app.current_stage?.name ?? formatStatusLabel(app.status)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 py-2">
          <dt className="text-muted-foreground text-xs">Items</dt>
          <dd className="text-right font-medium tabular-nums">{activeLines}</dd>
        </div>
        {app.created_at ? (
          <div className="flex items-baseline justify-between gap-3 py-2">
            <dt className="text-muted-foreground text-xs">Submitted</dt>
            <dd className="text-right font-medium">
              {new Date(app.created_at).toLocaleDateString()}
            </dd>
          </div>
        ) : null}
      </dl>

      {action ? <div className="grid gap-2">{action}</div> : null}
      {footnote ? (
        <p className="text-muted-foreground text-xs">{footnote}</p>
      ) : null}
    </DrsPanel>
  );
}

export function RequestDetailsSection({ app }: { app: DRSApplicationDetail }) {
  return (
    <DrsSection
      title="Request details"
      description={
        app.created_at
          ? `Submitted ${new Date(app.created_at).toLocaleString()}`
          : undefined
      }
      divided
      contentClassName="space-y-6"
    >
      <DrsDataList columns={3}>
        <DrsDataItem label="Student number">{app.student_no}</DrsDataItem>
        <DrsDataItem label="School year and term">
          {app.school_year || app.semester
            ? `${app.school_year || '—'} · ${app.semester || '—'}`
            : ''}
        </DrsDataItem>
        <DrsDataItem
          label="Receive by"
          hint={
            app.secure_email_requested
              ? 'A secure PDF copy will also be emailed'
              : undefined
          }
        >
          {formatStatusLabel(app.receive_mode)}
        </DrsDataItem>
        <DrsDataItem
          label="Mode of payment"
          hint={app.payment_method?.description}
        >
          {app.payment_method?.name}
        </DrsDataItem>
        {app.delivery_tracking_number ? (
          <DrsDataItem label="Tracking number">
            {app.delivery_tracking_number}
          </DrsDataItem>
        ) : null}
        {app.pickup_date ? (
          <DrsDataItem label="Pickup date">
            {formatPickupDate(app.pickup_date)}
          </DrsDataItem>
        ) : null}
      </DrsDataList>

      <RequestedLinesList app={app} />
      <SupportingDocumentsSection app={app} />
    </DrsSection>
  );
}

function RequestedLinesList({ app }: { app: DRSApplicationDetail }) {
  if (!app.lines?.length) {
    return (
      <div>
        <DrsOverline>Requested items</DrsOverline>
        <p className="text-muted-foreground mt-2 text-sm">
          This request has no line items.
        </p>
      </div>
    );
  }

  return (
    <div>
      <DrsOverline>Requested items</DrsOverline>
      <table className="mt-2 w-full text-sm">
        <thead className="sr-only">
          <tr>
            <th>Item</th>
            <th>Quantity</th>
          </tr>
        </thead>
        <tbody className="divide-border/70 divide-y border-y">
          {app.lines.map((line) => (
            <tr key={line.id}>
              <td
                className={`py-2 pr-4 ${
                  line.is_cancelled ? 'text-muted-foreground line-through' : ''
                }`}
              >
                {line.request_name}
              </td>
              <td
                className={`text-muted-foreground w-16 py-2 text-right tabular-nums ${
                  line.is_cancelled ? 'line-through' : ''
                }`}
              >
                &times;{line.quantity}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SupportingDocumentsSection({ app }: { app: DRSApplicationDetail }) {
  const requirements =
    app.lines?.flatMap((line) =>
      (line.supporting_document_requirements ?? []).map((requirement) => ({
        line,
        requirement,
      })),
    ) ?? [];

  if (requirements.length === 0) {
    return null;
  }

  return (
    <div>
      <DrsOverline>Supporting documents</DrsOverline>
      <div className="divide-border/70 mt-2 divide-y border-y">
        {requirements.map(({ line, requirement }) => (
          <SupportingRequirementRow
            key={requirement.id}
            app={app}
            lineName={line.request_name}
            requirement={requirement}
          />
        ))}
      </div>
    </div>
  );
}

function SupportingRequirementRow({
  app,
  lineName,
  requirement,
}: {
  app: DRSApplicationDetail;
  lineName: string;
  requirement: NonNullable<
    NonNullable<
      DRSApplicationDetail['lines']
    >[number]['supporting_document_requirements']
  >[number];
}) {
  const queryClient = useQueryClient();
  const [uploads, setUploads] = React.useState<TempUpload[]>([]);
  const canUpload = requirement.status !== 'submitted';

  const mutation = useMutation({
    mutationFn: () =>
      postApplicationSupportingRequirementUploads(
        app.id,
        requirement.id,
        uploads.map((upload) => upload.id),
      ),
    onSuccess: (updated) => {
      queryClient.setQueryData(['drs-application', app.id], updated);
      void queryClient.invalidateQueries({ queryKey: ['drs-applications'] });
      setUploads([]);
      toast.success('Supporting document uploaded.');
    },
    onError: () => {
      toast.error('Failed to upload supporting document.');
    },
  });

  return (
    <div className="space-y-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">{requirement.name}</p>
          <p className="text-muted-foreground text-xs">{lineName}</p>
          {requirement.instructions ? (
            <p className="text-muted-foreground mt-1 text-xs">
              {requirement.instructions}
            </p>
          ) : null}
        </div>
        <DrsStatusBadge tone={requirement.is_required ? 'warning' : 'neutral'}>
          {requirement.is_required ? 'Required' : 'Optional'}
        </DrsStatusBadge>
      </div>

      {requirement.files.length > 0 ? (
        <ul className="space-y-1">
          {requirement.files.map((file) => (
            <li key={file.id} className="text-sm">
              <a
                href={file.url}
                target={file.expires_at ? undefined : '_blank'}
                rel="noreferrer"
                className="text-primary inline-flex max-w-full min-w-0 items-center gap-2 underline-offset-2 hover:underline"
                onClick={(event) =>
                  handlePrivateFileDownloadClick(
                    event,
                    file.url,
                    file.file_name,
                    file.expires_at,
                    () => {
                      toast.error(
                        'Failed to download file. Please refresh and try again.',
                      );
                    },
                  )
                }
              >
                {file.expires_at ? (
                  <FileUp className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                ) : null}
                <span className="min-w-0">
                  <span className="block wrap-anywhere">{file.file_name}</span>
                  {file.expires_at ? (
                    <span className="text-muted-foreground block text-xs">
                      Private download - expires{' '}
                      {formatExpiryTime(file.expires_at)}
                    </span>
                  ) : null}
                </span>
              </a>{' '}
              <span className="text-muted-foreground text-xs">
                {formatFileSize(file.size)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-xs">No file submitted yet.</p>
      )}

      {canUpload ? (
        <div className="space-y-2">
          <SupportingDocumentDropzone
            label="Upload file"
            description={requirement.instructions}
            required={requirement.is_required}
            value={uploads}
            onChange={(nextUploads) => {
              if (mutation.isError) {
                mutation.reset();
              }
              setUploads(nextUploads);
            }}
            maxFiles={requirement.max_files ?? 1}
            maxSizeKb={requirement.max_file_size_kb}
            allowedMimeTypes={requirement.allowed_mime_types ?? []}
            disabled={mutation.isPending}
          />
          <Button
            type="button"
            size="sm"
            disabled={mutation.isPending || uploads.length === 0}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Saving…' : 'Submit upload'}
          </Button>
          {mutation.isError ? (
            <p className="text-destructive text-xs" role="alert">
              Supporting document was not submitted. Check the selected file and
              try again.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function PaymentStepPanel({
  app,
  uploads,
  remarks,
  isSubmitting,
  hasSubmitError,
  onUploadsChange,
  onRemarksChange,
  onSubmit,
}: {
  app: DRSApplicationDetail;
  uploads: TempUpload[];
  remarks: string;
  isSubmitting: boolean;
  hasSubmitError?: boolean;
  onUploadsChange: (uploads: TempUpload[]) => void;
  onRemarksChange: (value: string) => void;
  onSubmit: () => void;
}) {
  if (!isPaymentCollectionOpen(app)) return null;

  return (
    <DrsPanel
      title="Submit your payment"
      description="Upload your transaction receipt so the cashier can verify it."
      contentClassName="space-y-4"
    >
      {app.payment_method ? (
        <div>
          <DrsOverline>Mode of payment</DrsOverline>
          <p className="mt-1 text-sm font-medium">{app.payment_method.name}</p>
          {app.payment_method.description ? (
            <p className="text-muted-foreground mt-0.5 text-xs leading-5">
              {app.payment_method.description}
            </p>
          ) : null}
        </div>
      ) : null}
      <SupportingDocumentDropzone
        label="Payment receipt"
        description="PDF or image of your transaction receipt (max 3 files, 10 MB each)."
        required
        value={uploads}
        onChange={onUploadsChange}
        maxFiles={3}
        maxSizeKb={10240}
        allowedMimeTypes={[
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/webp',
        ]}
        disabled={isSubmitting}
      />
      <div className="space-y-2">
        <Label htmlFor="payment-remarks">Remarks</Label>
        <Textarea
          id="payment-remarks"
          value={remarks}
          onChange={(event) => onRemarksChange(event.target.value)}
          placeholder="Optional note for the cashier"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={isSubmitting || uploads.length === 0}
          onClick={onSubmit}
        >
          {isSubmitting ? 'Submitting…' : 'Submit payment proof'}
        </Button>
        {uploads.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            Attach at least one receipt to submit.
          </p>
        ) : null}
      </div>
      {hasSubmitError ? (
        <p className="text-destructive text-sm" role="alert">
          Payment proof was not submitted. Check your receipt file and try
          again.
        </p>
      ) : null}
    </DrsPanel>
  );
}

export function PaymentBreakdownSection({
  app,
}: {
  app: DRSApplicationDetail;
}) {
  const breakdown = paymentBreakdownFor(app);

  if (!breakdown.hasAmount) return null;

  return (
    <DrsSection
      title="Assessment"
      description="What this request costs, as assessed by the registrar."
      divided
    >
      <table className="w-full text-sm">
        <thead className="sr-only">
          <tr>
            <th>Item</th>
            <th>Amount</th>
          </tr>
        </thead>
        {breakdown.hasBreakdown ? (
          <tbody className="divide-border/70 divide-y">
            {breakdown.lines.map((line) => (
              <tr key={line.id}>
                <td className="py-2 pr-4">
                  <span className="block">{line.label}</span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {formatMoney(line.unitPrice)} &times; {line.quantity}
                  </span>
                </td>
                <td className="py-2 text-right align-top tabular-nums">
                  {formatMoney(line.amount)}
                </td>
              </tr>
            ))}
            {breakdown.otherFees.map((fee) => (
              <tr key={fee.id}>
                <td className="py-2 pr-4">{fee.label}</td>
                <td className="py-2 text-right tabular-nums">
                  {formatMoney(fee.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        ) : null}
        <tfoot>
          <tr className="border-foreground/20 border-t-2">
            <th scope="row" className="py-2 pr-4 text-left font-medium">
              Total amount due
            </th>
            <td className="py-2 text-right text-base font-semibold tabular-nums">
              {formatMoney(breakdown.total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </DrsSection>
  );
}

export function PaymentReferencesSection({
  app,
}: {
  app: DRSApplicationDetail;
}) {
  if (!app.payment_submission && !app.payment_verification) return null;

  const receipts = app.payment_submission?.receipts ?? [];

  return (
    <DrsSection
      title="Payment proof"
      description="Receipt and verification details on file for this request."
      divided
      contentClassName="space-y-4 text-sm"
    >
      {app.payment_submission ? (
        <div className="space-y-2">
          <DrsOverline>Student payment proof</DrsOverline>
          {app.payment_submission.submitted_at ? (
            <p className="text-muted-foreground text-xs">
              Uploaded{' '}
              {new Date(app.payment_submission.submitted_at).toLocaleString()}
            </p>
          ) : null}
          {receipts.length > 0 ? (
            <ul className="space-y-1">
              {receipts.map((file) => (
                <li
                  key={file.id}
                  className="flex flex-wrap items-baseline gap-2"
                >
                  <a
                    href={file.url}
                    className="text-primary inline-flex max-w-full min-w-0 items-center gap-2 underline-offset-2 hover:underline"
                    onClick={(event) =>
                      handlePrivateFileDownloadClick(
                        event,
                        file.url,
                        file.file_name,
                        file.expires_at,
                        () => {
                          toast.error(
                            'Failed to download receipt. Please refresh and try again.',
                          );
                        },
                      )
                    }
                  >
                    <span className="min-w-0 wrap-anywhere">
                      {file.file_name}
                    </span>
                  </a>
                  <span className="text-muted-foreground text-xs">
                    {formatFileSize(file.size)}
                  </span>
                </li>
              ))}
            </ul>
          ) : app.payment_submission.reference_number ? (
            <p className="font-medium">
              Reference: {app.payment_submission.reference_number}
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">No receipt on file.</p>
          )}
          {app.payment_submission.remarks ? (
            <p className="text-muted-foreground whitespace-pre-wrap">
              {app.payment_submission.remarks}
            </p>
          ) : null}
        </div>
      ) : null}
      {app.payment_verification ? (
        <PaymentReferenceBlock
          label="Verification notes"
          reference={app.payment_verification.reference_number}
          remarks={app.payment_verification.remarks}
          timestampLabel="Verified"
          timestamp={app.payment_verification.verified_at}
        />
      ) : null}
    </DrsSection>
  );
}

function PaymentReferenceBlock({
  label,
  reference,
  remarks,
  timestamp,
  timestampLabel,
}: {
  label: string;
  reference: string | null;
  remarks?: string | null;
  timestamp?: string | null;
  timestampLabel?: string;
}) {
  return (
    <div className="space-y-1">
      <DrsOverline>{label}</DrsOverline>
      <p className="font-medium">{reference ?? '—'}</p>
      {timestamp ? (
        <p className="text-muted-foreground text-xs">
          {timestampLabel ?? 'Updated'} {new Date(timestamp).toLocaleString()}
        </p>
      ) : null}
      {remarks ? (
        <p className="text-muted-foreground whitespace-pre-wrap">{remarks}</p>
      ) : null}
    </div>
  );
}

export function ClearancesSection({
  clearances,
}: {
  clearances?: DRSApplicationClearanceRow[];
}) {
  if (!clearances?.length) return null;

  const cleared = clearances.filter(
    (clearance) => clearance.status === 'cleared',
  ).length;

  return (
    <DrsSection
      title="Clearances"
      description={`${cleared} of ${clearances.length} departments have signed off.`}
      divided
    >
      <ul className="divide-border/70 divide-y">
        {clearances.map((clearance) => (
          <li key={clearance.id} className="py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">{clearance.clearance_name}</p>
              <div className="flex flex-wrap items-center gap-2">
                {clearance.cleared_at ? (
                  <span className="text-muted-foreground text-xs">
                    {new Date(clearance.cleared_at).toLocaleString()}
                  </span>
                ) : null}
                <DrsStatusBadge
                  tone={clearance.status === 'cleared' ? 'success' : 'warning'}
                >
                  {formatStatusLabel(clearance.status)}
                </DrsStatusBadge>
              </div>
            </div>
            {clearance.remarks ? (
              <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
                {clearance.remarks}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </DrsSection>
  );
}

export function MessagesPanel({ applicationId }: { applicationId: string }) {
  return (
    <DrsPanel
      title="Messages"
      description="Ask the registrar about this request."
      contentClassName="p-0"
    >
      <ApplicationMessagesPanel
        applicationId={applicationId}
        viewerRole="student"
      />
    </DrsPanel>
  );
}

export function EditRequestSection({
  editable,
  email,
  contactNumber,
  receiveMode,
  paymentMethodId,
  paymentMethods,
  secureEmail,
  deliveryAddress,
  purpose,
  lines,
  lockedCompanionIds = [],
  lockedCompanionLabels = {},
  canSubmitEdit,
  hasSaveError,
  onEmailChange,
  onContactNumberChange,
  onReceiveModeChange,
  onPaymentMethodChange,
  onSecureEmailChange,
  onDeliveryAddressChange,
  onPurposeChange,
  onLinesChange,
  onOpenCatalog,
  onSave,
}: {
  editable: boolean;
  email: string;
  contactNumber: string;
  receiveMode: 'delivery' | 'pickup';
  paymentMethodId: string;
  paymentMethods: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
  secureEmail: boolean;
  deliveryAddress: string;
  purpose: string;
  lines: DraftLine[];
  lockedCompanionIds?: number[];
  lockedCompanionLabels?: Record<number, string>;
  canSubmitEdit: boolean;
  hasSaveError?: boolean;
  onEmailChange: (value: string) => void;
  onContactNumberChange: (value: string) => void;
  onReceiveModeChange: (value: 'delivery' | 'pickup') => void;
  onPaymentMethodChange: (value: string) => void;
  onSecureEmailChange: (value: boolean) => void;
  onDeliveryAddressChange: (value: string) => void;
  onPurposeChange: (value: string) => void;
  onLinesChange: React.Dispatch<React.SetStateAction<DraftLine[]>>;
  onOpenCatalog: () => void;
  onSave: () => void;
}) {
  const selectedPaymentMethod = paymentMethods.find(
    (method) => method.id === paymentMethodId,
  );

  if (!editable) {
    return (
      <DrsSection
        title="Request details are locked"
        description="This request has moved past the initial review stage, so its contents can no longer be changed. You can still upload supporting documents, submit payment, or message the registrar."
        divided
      >
        <DrsDataList columns={3}>
          <DrsDataItem label="Contact email">{email}</DrsDataItem>
          <DrsDataItem
            label="Receive by"
            hint={secureEmail ? 'Secure PDF copy also requested' : undefined}
          >
            {formatStatusLabel(receiveMode)}
          </DrsDataItem>
          <DrsDataItem label="Mode of payment">
            {selectedPaymentMethod?.name}
          </DrsDataItem>
        </DrsDataList>
      </DrsSection>
    );
  }

  return (
    <DrsSection
      title="Edit request"
      description="This request is still in its initial stage, so you can change your contact details and adjust the items you asked for."
      divided
      contentClassName="max-w-2xl space-y-6"
    >
      <div className="space-y-4">
        <DrsOverline>Contact</DrsOverline>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact">Contact number</Label>
            <Input
              id="contact"
              value={contactNumber}
              onChange={(e) => onContactNumberChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <DrsOverline>Delivery and payment</DrsOverline>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-receive-mode">Receive by</Label>
            <Select
              value={receiveMode}
              onValueChange={(v) =>
                onReceiveModeChange(v as 'delivery' | 'pickup')
              }
            >
              <SelectTrigger id="edit-receive-mode" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pickup">Pickup at registrar</SelectItem>
                <SelectItem value="delivery">Courier delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-payment-method">Mode of payment</Label>
            <Select
              value={paymentMethodId || undefined}
              onValueChange={onPaymentMethodChange}
              disabled={paymentMethods.length === 0}
            >
              <SelectTrigger id="edit-payment-method" className="w-full">
                <SelectValue
                  placeholder={
                    paymentMethods.length === 0
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
          </div>
        </div>

        {receiveMode === 'delivery' ? (
          <div className="space-y-1.5">
            <Label htmlFor="addr">Delivery address</Label>
            <Textarea
              id="addr"
              rows={3}
              value={deliveryAddress}
              onChange={(e) => onDeliveryAddressChange(e.target.value)}
            />
          </div>
        ) : null}

        <div className="flex items-start gap-2.5">
          <Checkbox
            id="edit-secure-email"
            className="mt-0.5"
            checked={secureEmail}
            onCheckedChange={(checked) => onSecureEmailChange(checked === true)}
          />
          <div>
            <Label htmlFor="edit-secure-email">
              Also email me a secure PDF copy
            </Label>
            <p className="text-muted-foreground text-xs">
              A password-protected PDF is sent to your email address.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="purpose">Purpose</Label>
          <Textarea
            id="purpose"
            rows={2}
            placeholder="e.g. employment abroad, scholarship"
            value={purpose}
            onChange={(e) => onPurposeChange(e.target.value)}
          />
        </div>
      </div>

      <RequestedItemsEditor
        editable={editable}
        lines={lines}
        lockedCompanionIds={lockedCompanionIds}
        lockedCompanionLabels={lockedCompanionLabels}
        onLinesChange={onLinesChange}
        onOpenCatalog={onOpenCatalog}
      />

      <div className="flex flex-wrap items-center gap-3 border-t pt-4">
        <Button type="button" disabled={!canSubmitEdit} onClick={onSave}>
          Save changes
        </Button>
        {lines.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            Add at least one item before saving.
          </p>
        ) : null}
      </div>
      {hasSaveError ? (
        <p className="text-destructive text-sm" role="alert">
          Request changes were not saved. Review the fields and try again.
        </p>
      ) : null}
    </DrsSection>
  );
}

function RequestedItemsEditor({
  editable,
  lines,
  lockedCompanionIds = [],
  lockedCompanionLabels = {},
  onLinesChange,
  onOpenCatalog,
}: {
  editable: boolean;
  lines: DraftLine[];
  lockedCompanionIds?: number[];
  lockedCompanionLabels?: Record<number, string>;
  onLinesChange: React.Dispatch<React.SetStateAction<DraftLine[]>>;
  onOpenCatalog: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DrsOverline>Requested items</DrsOverline>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!editable}
          onClick={onOpenCatalog}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add item
        </Button>
      </div>
      <div className="divide-border/70 divide-y border-y">
        {lines.length === 0 ? (
          <p className="text-muted-foreground py-3 text-sm">
            No items yet. Add at least one document or package to save.
          </p>
        ) : null}
        {lines.map((line, index) => {
          const isLockedCompanion =
            line.requestable_type === 'document' &&
            lockedCompanionIds.includes(line.requestable_id);
          const lockedBy = lockedCompanionLabels[line.requestable_id];

          return (
            <div
              key={`${line.requestable_type}-${line.requestable_id}-${index}`}
              className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{line.label}</p>
                {isLockedCompanion && lockedBy ? (
                  <p className="text-muted-foreground text-xs">
                    Required with {lockedBy}. It cannot be removed while that
                    document is selected.
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2 sm:w-auto">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor={`line-qty-${index}`}
                    className="text-muted-foreground text-xs"
                  >
                    Qty
                  </Label>
                  <Input
                    id={`line-qty-${index}`}
                    type="number"
                    min={1}
                    max={MAX_LINE_QTY}
                    className="h-8 w-20"
                    value={line.quantity}
                    disabled={!editable}
                    onChange={(e) => {
                      const n = Number.parseInt(e.target.value, 10);
                      onLinesChange((prev) =>
                        prev.map((row, rowIndex) =>
                          rowIndex === index
                            ? {
                                ...row,
                                quantity: Number.isFinite(n)
                                  ? Math.min(MAX_LINE_QTY, Math.max(1, n))
                                  : 1,
                              }
                            : row,
                        ),
                      );
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive shrink-0"
                  disabled={!editable || isLockedCompanion}
                  aria-label={`Remove ${line.label}`}
                  onClick={() =>
                    onLinesChange((prev) =>
                      prev.filter((_, rowIndex) => rowIndex !== index),
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
