import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
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
import { Plus, Search, Trash2 } from 'lucide-react';
import * as React from 'react';

import {
  DrsStatusBadge,
  formatStatusLabel,
  toneForStatus,
} from '@/components/drs-ui.tsx';
import { SupportingDocumentDropzone } from '@/components/supporting-document-dropzone.tsx';
import { formatFileSize, type TempUpload } from '@/lib/tempUploads.ts';
import { ApplicationMessagesPanel } from './-application-messages-panel.tsx';
import { postApplicationSupportingRequirementUploads } from './-lib/api/postApplicationSupportingRequirementUploads.ts';
import {
  displayApplicationRef,
  type DRSApplicationClearanceRow,
  type DRSApplicationDetail,
} from './-lib/types/applications.ts';
import { LoadingIndicator } from './-loading-indicator.tsx';
import {
  itemVisibleForRules,
  PLACEHOLDER_STUDENT_CONTEXT,
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
      ?.filter((line) => line.assessed_unit_price != null)
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
  const ctx = PLACEHOLDER_STUDENT_CONTEXT;
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

  const q = search.trim().toLowerCase();
  const pickRows = React.useMemo(() => {
    const groups: CatalogGroup[] = catalogQuery.data ?? [];
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

export function RequestDetailsCard({ app }: { app: DRSApplicationDetail }) {
  return (
    <Card className="drs-card">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">Request details</CardTitle>
            <CardDescription>
              Reference #{displayApplicationRef(app)} - Submitted{' '}
              {app.created_at ? new Date(app.created_at).toLocaleString() : '-'}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-1">
            <DrsStatusBadge tone={toneForStatus(app.status)}>
              {formatStatusLabel(app.status)}
            </DrsStatusBadge>
            {app.current_stage?.name ? (
              <DrsStatusBadge tone="info">
                {app.current_stage.name}
              </DrsStatusBadge>
            ) : null}
            {app.is_paid ? (
              <DrsStatusBadge tone="success">Paid</DrsStatusBadge>
            ) : (
              <DrsStatusBadge tone="warning">Unpaid</DrsStatusBadge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-xs font-medium">
              Student no.
            </p>
            <p className="font-medium">{app.student_no || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium">
              School year / Sem
            </p>
            <p className="font-medium">
              {app.school_year || '-'} - {app.semester || '-'}
            </p>
          </div>
        </div>
        <RequestedLinesList app={app} />
        <SupportingDocumentsSection app={app} />
      </CardContent>
    </Card>
  );
}

function RequestedLinesList({ app }: { app: DRSApplicationDetail }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs font-medium">Lines</p>
      <ul className="bg-muted/20 mt-2 space-y-2 rounded-2xl border p-3">
        {app.lines?.length ? (
          app.lines.map((line) => (
            <li
              key={line.id}
              className="bg-background/70 flex justify-between gap-3 rounded-xl px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate">
                {line.request_name}
              </span>
              <span className="text-muted-foreground shrink-0">
                x {line.quantity}
              </span>
            </li>
          ))
        ) : (
          <li className="text-muted-foreground">No line items</li>
        )}
      </ul>
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
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs font-medium">
        Supporting documents
      </p>
      <div className="bg-muted/20 space-y-3 rounded-2xl border p-3">
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
    <div className="bg-background/80 space-y-3 rounded-2xl border p-3 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{requirement.name}</p>
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
                target="_blank"
                rel="noreferrer"
                className="text-primary underline-offset-2 hover:underline"
              >
                {file.file_name}
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

export function PaymentStepCard({
  app,
  referenceNumber,
  remarks,
  isSubmitting,
  hasSubmitError,
  onReferenceNumberChange,
  onRemarksChange,
  onSubmit,
}: {
  app: DRSApplicationDetail;
  referenceNumber: string;
  remarks: string;
  isSubmitting: boolean;
  hasSubmitError?: boolean;
  onReferenceNumberChange: (value: string) => void;
  onRemarksChange: (value: string) => void;
  onSubmit: () => void;
}) {
  if (!isPaymentCollectionOpen(app)) return null;

  return (
    <Card className="drs-card">
      <CardHeader>
        <CardTitle className="text-base">Payment</CardTitle>
        <CardDescription>
          Enter your payment reference number to continue this request.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="payment-reference-number">Reference number</Label>
          <Input
            id="payment-reference-number"
            value={referenceNumber}
            onChange={(event) => onReferenceNumberChange(event.target.value)}
            placeholder="Payment reference number"
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment-remarks">Remarks</Label>
          <Textarea
            id="payment-remarks"
            value={remarks}
            onChange={(event) => onRemarksChange(event.target.value)}
            placeholder="Optional payment remarks"
          />
        </div>
        <Button
          type="button"
          disabled={isSubmitting}
          onClick={onSubmit}
          className="rounded-full"
        >
          Submit payment reference
        </Button>
        {hasSubmitError ? (
          <p className="text-destructive text-sm" role="alert">
            Payment reference was not submitted. Confirm the reference number
            and try again.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function PaymentBreakdownCard({ app }: { app: DRSApplicationDetail }) {
  const breakdown = paymentBreakdownFor(app);

  if (!breakdown.hasAmount) return null;

  return (
    <Card className="drs-card">
      <CardHeader>
        <CardTitle className="text-base">Payment breakdown</CardTitle>
        <CardDescription>
          Summary of the assessed amount for this request.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {breakdown.hasBreakdown ? (
          <div className="bg-muted/20 space-y-2 rounded-2xl border p-3">
            {breakdown.lines.map((line) => (
              <div key={line.id} className="flex justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{line.label}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatMoney(line.unitPrice)} x {line.quantity}
                  </p>
                </div>
                <p className="shrink-0 font-medium">
                  {formatMoney(line.amount)}
                </p>
              </div>
            ))}
            {breakdown.otherFees.map((fee) => (
              <div key={fee.id} className="flex justify-between gap-3">
                <p className="min-w-0 truncate font-medium">{fee.label}</p>
                <p className="shrink-0 font-medium">
                  {formatMoney(fee.amount)}
                </p>
              </div>
            ))}
          </div>
        ) : null}
        <div className="bg-primary/10 text-primary border-primary/20 flex justify-between gap-3 rounded-2xl border p-4">
          <span className="font-medium">Total amount due</span>
          <span className="font-semibold">{formatMoney(breakdown.total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function PaymentReferencesCard({ app }: { app: DRSApplicationDetail }) {
  if (!app.payment_submission && !app.payment_verification) return null;

  return (
    <Card className="drs-card">
      <CardHeader>
        <CardTitle className="text-base">Payment references</CardTitle>
        <CardDescription>
          Reference numbers recorded for this request.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {app.payment_submission ? (
          <PaymentReferenceBlock
            label="Payment reference no."
            reference={app.payment_submission.reference_number}
            remarks={app.payment_submission.remarks}
          />
        ) : null}
        {app.payment_verification ? (
          <PaymentReferenceBlock
            label="Verification reference no."
            reference={app.payment_verification.reference_number}
            remarks={app.payment_verification.remarks}
            timestampLabel="Verified"
            timestamp={app.payment_verification.verified_at}
          />
        ) : null}
      </CardContent>
    </Card>
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
    <div className="bg-muted/20 rounded-2xl border p-3">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="mt-1 font-medium">{reference ?? '-'}</p>
      {timestamp ? (
        <p className="text-muted-foreground mt-1 text-xs">
          {timestampLabel ?? 'Updated'} {new Date(timestamp).toLocaleString()}
        </p>
      ) : null}
      {remarks ? (
        <p className="text-muted-foreground mt-2 whitespace-pre-wrap">
          {remarks}
        </p>
      ) : null}
    </div>
  );
}

export function ClearancesCard({
  clearances,
}: {
  clearances?: DRSApplicationClearanceRow[];
}) {
  if (!clearances?.length) return null;

  return (
    <Card className="drs-card">
      <CardHeader>
        <CardTitle className="text-base">Clearances</CardTitle>
        <CardDescription>
          Status of each clearance department for this request.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {clearances.map((clearance) => (
          <div
            key={clearance.id}
            className="bg-muted/20 rounded-2xl border p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{clearance.clearance_name}</p>
              <div className="flex flex-wrap items-center gap-2">
                <DrsStatusBadge
                  tone={clearance.status === 'cleared' ? 'success' : 'warning'}
                >
                  {formatStatusLabel(clearance.status)}
                </DrsStatusBadge>
                {clearance.cleared_at ? (
                  <span className="text-muted-foreground text-xs">
                    {new Date(clearance.cleared_at).toLocaleString()}
                  </span>
                ) : null}
              </div>
            </div>
            {clearance.remarks ? (
              <p className="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">
                {clearance.remarks}
              </p>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function MessagesCard({ applicationId }: { applicationId: string }) {
  return (
    <Card className="drs-card">
      <CardHeader>
        <CardTitle className="text-base">Messages</CardTitle>
        <CardDescription>
          Chat with the registrar and any staff handling your request.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ApplicationMessagesPanel
          applicationId={applicationId}
          viewerRole="student"
        />
      </CardContent>
    </Card>
  );
}

export function EditRequestCard({
  editable,
  email,
  contactNumber,
  receiveMode,
  deliveryAddress,
  purpose,
  lines,
  canSubmitEdit,
  hasSaveError,
  onEmailChange,
  onContactNumberChange,
  onReceiveModeChange,
  onDeliveryAddressChange,
  onPurposeChange,
  onLinesChange,
  onOpenCatalog,
  onSave,
}: {
  editable: boolean;
  email: string;
  contactNumber: string;
  receiveMode: 'email' | 'delivery' | 'pickup';
  deliveryAddress: string;
  purpose: string;
  lines: DraftLine[];
  canSubmitEdit: boolean;
  hasSaveError?: boolean;
  onEmailChange: (value: string) => void;
  onContactNumberChange: (value: string) => void;
  onReceiveModeChange: (value: 'email' | 'delivery' | 'pickup') => void;
  onDeliveryAddressChange: (value: string) => void;
  onPurposeChange: (value: string) => void;
  onLinesChange: React.Dispatch<React.SetStateAction<DraftLine[]>>;
  onOpenCatalog: () => void;
  onSave: () => void;
}) {
  if (!editable) {
    return (
      <Card className="drs-card">
        <CardHeader>
          <CardTitle className="text-base">Edit request</CardTitle>
          <CardDescription>
            This request is locked because it has already moved beyond the
            initial review stage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="bg-muted/20 rounded-2xl border p-4">
            <p className="font-medium">No changes are needed from this form.</p>
            <p className="text-muted-foreground mt-1 leading-6">
              You can still review the request details, upload any pending
              supporting documents, submit payment information when requested,
              or message the registrar for help.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-xs font-medium">
                Contact email
              </p>
              <p className="font-medium">{email || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">
                Receive mode
              </p>
              <p className="font-medium">{formatStatusLabel(receiveMode)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="drs-card">
      <CardHeader>
        <CardTitle className="text-base">Edit request</CardTitle>
        <CardDescription>
          While this request is still in its initial stage, you can change
          contact details and adjust requested items.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              disabled={!editable}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact">Contact number</Label>
            <Input
              id="contact"
              value={contactNumber}
              onChange={(e) => onContactNumberChange(e.target.value)}
              disabled={!editable}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Receive mode</Label>
          <Select
            value={receiveMode}
            onValueChange={(v) =>
              onReceiveModeChange(v as 'email' | 'delivery' | 'pickup')
            }
            disabled={!editable}
          >
            <SelectTrigger className="w-full sm:max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pickup">Pickup</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {receiveMode === 'delivery' ? (
          <div className="space-y-2">
            <Label htmlFor="addr">Delivery address</Label>
            <Textarea
              id="addr"
              value={deliveryAddress}
              onChange={(e) => onDeliveryAddressChange(e.target.value)}
              disabled={!editable}
            />
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="purpose">Purpose</Label>
          <Textarea
            id="purpose"
            value={purpose}
            onChange={(e) => onPurposeChange(e.target.value)}
            disabled={!editable}
          />
        </div>
        <RequestedItemsEditor
          editable={editable}
          lines={lines}
          onLinesChange={onLinesChange}
          onOpenCatalog={onOpenCatalog}
        />
        <Button
          type="button"
          disabled={!canSubmitEdit}
          onClick={onSave}
          className="rounded-full"
        >
          Save changes
        </Button>
        {hasSaveError ? (
          <p className="text-destructive text-sm" role="alert">
            Request changes were not saved. Review the fields and try again.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function RequestedItemsEditor({
  editable,
  lines,
  onLinesChange,
  onOpenCatalog,
}: {
  editable: boolean;
  lines: DraftLine[];
  onLinesChange: React.Dispatch<React.SetStateAction<DraftLine[]>>;
  onOpenCatalog: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>Requested items</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1 rounded-full"
          disabled={!editable}
          onClick={onOpenCatalog}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add document or package
        </Button>
      </div>
      <div className="bg-muted/20 space-y-2 rounded-2xl border p-3">
        {lines.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No items yet. Add at least one document or package to save.
          </p>
        ) : null}
        {lines.map((line, index) => (
          <div
            key={`${line.requestable_type}-${line.requestable_id}-${index}`}
            className="bg-background/80 flex flex-col gap-2 rounded-xl p-3 sm:flex-row sm:items-center"
          >
            <p className="min-w-0 flex-1 truncate text-sm font-medium">
              {line.label}
            </p>
            <div className="flex items-center gap-2 sm:w-auto">
              <div className="flex items-center gap-2 sm:w-40">
                <Label className="text-muted-foreground text-xs">Qty</Label>
                <Input
                  type="number"
                  min={1}
                  max={MAX_LINE_QTY}
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
                disabled={!editable}
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
        ))}
      </div>
    </div>
  );
}
